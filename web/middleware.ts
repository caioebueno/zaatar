import { NextRequest, NextResponse } from "next/server";

const CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_HEADERS = "Content-Type, Authorization";

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function getAllowOriginValue(request: NextRequest): string | null {
  const requestOrigin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.length === 0) {
    return "*";
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  if (!requestOrigin) {
    return allowedOrigins[0];
  }

  return null;
}

function applyCorsHeaders(response: NextResponse, request: NextRequest): void {
  const allowOrigin = getAllowOriginValue(request);
  const requestedHeaders = request.headers.get("access-control-request-headers");

  if (allowOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowOrigin);
    response.headers.append("Vary", "Origin");
  }

  response.headers.set("Access-Control-Allow-Methods", CORS_METHODS);
  response.headers.set(
    "Access-Control-Allow-Headers",
    requestedHeaders || CORS_HEADERS,
  );
  response.headers.set("Access-Control-Max-Age", "86400");
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    const preflightResponse = new NextResponse(null, { status: 204 });

    applyCorsHeaders(preflightResponse, request);

    return preflightResponse;
  }

  const response = NextResponse.next();
  applyCorsHeaders(response, request);

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
