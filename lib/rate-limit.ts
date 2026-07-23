import { NextRequest, NextResponse } from "next/server";
import { logger, generateRequestId } from "./logger";
import { getEnv } from "./env";

// In-memory store for rate limiting (for single instance)
// For production with multiple instances, use Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    const resetIn = Math.ceil((bucket.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  bucket.count++;
  return { allowed: true, remaining: limit - bucket.count };
}

// Middleware to add rate limiting headers and request ID
export function withRateLimit(
  keyFn: (request: NextRequest) => string,
  limit?: number,
  windowMs?: number
) {
  return async (request: NextRequest) => {
    const env = getEnv();
    const limitConfig = {
      limit: limit ?? env.rateLimitMaxRequests,
      window: windowMs ?? env.rateLimitWindowMs,
    };

    const key = keyFn(request);
    const { allowed, remaining, resetIn } = checkRateLimit(
      key,
      limitConfig.limit,
      limitConfig.window
    );

    if (!allowed) {
      logger.warn("Rate limit exceeded", { key, resetIn });
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(resetIn),
            "X-RateLimit-Limit": String(limitConfig.limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Add rate limit headers to response
    const requestId = generateRequestId();
    return {
      requestId,
      headers: {
        "X-Request-Id": requestId,
        "X-RateLimit-Limit": String(limitConfig.limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    };
  };
}

// Rate limit by IP
export function rateLimitByIp(
  limit?: number,
  windowMs?: number
) {
  return withRateLimit(
    (req) => `ip:${getClientIp(req)}`,
    limit,
    windowMs
  );
}

// Rate limit by user (requires auth)
export function rateLimitByUserId(
  userId: number,
  limit?: number,
  windowMs?: number
) {
  return withRateLimit(
    () => `user:${userId}`,
    limit,
    windowMs
  );
}

// Rate limit by endpoint + IP
export function rateLimitByEndpoint(
  limit?: number,
  windowMs?: number
) {
  return withRateLimit(
    (req) => `endpoint:${req.nextUrl.pathname}:${getClientIp(req)}`,
    limit,
    windowMs
  );
}

// Clean up old buckets periodically (run this in background)
export function startRateLimitCleanup(intervalMs: number = 600000) {
  // Clean up every 10 minutes by default
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitStore.entries()) {
      if (now > bucket.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, intervalMs);
}
