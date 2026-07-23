import { NextResponse, type NextRequest } from "next/server";
import { logger, generateRequestId } from "./logger";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(401, message, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = "Forbidden") {
    super(403, message, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Not found") {
    super(404, message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = "Too many requests") {
    super(429, message, "RATE_LIMIT");
    this.name = "RateLimitError";
  }
}

// Success Response
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string
) {
  return NextResponse.json(
    {
      ok: true,
      code: "SUCCESS",
      data,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// Error Response
export function errorResponse(
  error: Error | ApiError | unknown,
  requestId?: string
) {
  let statusCode = 500;
  let message = "Internal server error";
  let code = "INTERNAL_ERROR";

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  } else if (error instanceof Error) {
    message = error.message;
    logger.error("Unexpected error", error, { requestId });
  }

  // Never leak sensitive error details in production
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Internal server error";
  }

  return NextResponse.json(
    {
      ok: false,
      code,
      error: message,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// Wrapper for API routes with error handling
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;

      logger.info("API request completed", {
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

// Wrapper for protected routes (authentication + error handling)
export function withAuth(
  handler: (request: NextRequest, userId: number) => Promise<NextResponse>
) {
  return withErrorHandling(async (request: NextRequest) => {
    const { getCurrentUser } = await import("./auth");
    const user = await getCurrentUser();

    if (!user) {
      throw new AuthenticationError();
    }

    return handler(request, user.id);
  });
}
