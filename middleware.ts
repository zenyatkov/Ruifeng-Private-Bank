import { NextRequest, NextResponse } from "next/server";
import { logger, generateRequestId } from "@/lib/logger";

export async function middleware(request: NextRequest) {
  const requestId = generateRequestId();

  // Log IP and system info for all requests
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const country = request.headers.get("x-vercel-ip-country") || "unknown";
  const city = request.headers.get("x-vercel-ip-city") || "unknown";
  const region = request.headers.get("x-vercel-ip-country-region") || "unknown";

  logger.info("Incoming request", {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    ip,
    userAgent,
    country,
    city,
    region,
  });

  // Create response with request ID
  const response = NextResponse.next();
  response.headers.set("X-Request-Id", requestId);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password|\\?.*|_next).*)",
  ],
};
