import { NextRequest, NextResponse } from "next/server";
import { logger, generateRequestId } from "./logger";

export async function middleware(request: NextRequest) {
  // Generate request ID for tracing
  const requestId = generateRequestId();

  // Log incoming request
  logger.info("Incoming request", {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    ip: request.headers.get("x-forwarded-for") || "unknown",
  });

  // Create response with request ID
  const response = NextResponse.next();
  response.headers.set("X-Request-Id", requestId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
