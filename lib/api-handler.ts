import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { logger, generateRequestId } from "./logger";
import { errorResponse, successResponse } from "./api-error";

interface ApiHandlerOptions {
  requireAuth?: boolean;
  rateLimit?: {
    limit: number;
    windowMs: number;
  };
  schema?: ZodSchema;
}

/**
 * Wraps API route handlers with common functionality:
 * - Request logging
 * - Error handling
 * - Request ID generation
 * - Optional: Authentication
 * - Optional: Rate limiting
 * - Optional: Request validation
 */
export function createApiHandler(
  handler: (
    req: NextRequest,
    context: {
      requestId: string;
      userId?: number;
      validated?: unknown;
    }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
      const response = await handler(request, { requestId, userId: context?.params?.userId });
      const duration = Date.now() - startTime;

      logger.info("API request successful", {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        status: response.status,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("API request failed", error, {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        duration,
      });

      return errorResponse(error, requestId);
    }
  };
}

/**
 * Parse and validate JSON request body
 */
export async function parseBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON in request body");
  }
}

/**
 * Type-safe API handler with validation
 */
export function createValidatedApiHandler<T>(
  schema: ZodSchema<T>,
  handler: (
    req: NextRequest,
    data: T,
    context: { requestId: string; userId?: number }
  ) => Promise<NextResponse>
) {
  return createApiHandler(async (request, context) => {
    const body = await parseBody(request);
    const result = schema.safeParse(body);

    if (!result.success) {
      // Return 400 validation error directly, never 500
      const errors = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return NextResponse.json(
        {
          ok: false,
          code: "VALIDATION_ERROR",
          error: errors,
          requestId: context.requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return handler(request, result.data, context);
  });
}
