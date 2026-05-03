import { NextRequest, NextResponse } from "next/server";
import {
  MENU_ID_COOKIE_NAME,
  MENU_ID_HEADER_NAME,
  PROMOTION_ID_COOKIE_NAME,
  PROMOTION_ID_HEADER_NAME,
} from "./src/constants/menu";

const CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_HEADERS = "Content-Type, Authorization";
const MENU_CONTEXT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

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
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isMenuRoute = request.nextUrl.pathname.startsWith("/menu");

  if (request.method === "OPTIONS") {
    if (!isApiRoute) {
      return NextResponse.next();
    }

    const preflightResponse = new NextResponse(null, { status: 204 });

    applyCorsHeaders(preflightResponse, request);

    return preflightResponse;
  }

  const requestHeaders = new Headers(request.headers);
  const menuIdFromQuery = isMenuRoute
    ? request.nextUrl.searchParams.get("menuId")?.trim() || ""
    : "";
  const hasPromotionIdQueryParam = isMenuRoute
    ? request.nextUrl.searchParams.has("promotionId")
    : false;
  const promotionIdFromQuery = isMenuRoute
    ? request.nextUrl.searchParams.get("promotionId")?.trim() || ""
    : "";

  if (menuIdFromQuery) {
    requestHeaders.set(MENU_ID_HEADER_NAME, menuIdFromQuery);
  }
  if (hasPromotionIdQueryParam) {
    requestHeaders.set(PROMOTION_ID_HEADER_NAME, promotionIdFromQuery);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isApiRoute) {
    applyCorsHeaders(response, request);
  }

  if (menuIdFromQuery) {
    response.cookies.set(MENU_ID_COOKIE_NAME, menuIdFromQuery, {
      sameSite: "lax",
      path: "/",
      maxAge: MENU_CONTEXT_COOKIE_MAX_AGE_SECONDS,
    });
  }
  if (hasPromotionIdQueryParam) {
    if (promotionIdFromQuery) {
      response.cookies.set(PROMOTION_ID_COOKIE_NAME, promotionIdFromQuery, {
        sameSite: "lax",
        path: "/",
        maxAge: MENU_CONTEXT_COOKIE_MAX_AGE_SECONDS,
      });
    } else {
      response.cookies.delete(PROMOTION_ID_COOKIE_NAME);
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/menu/:path*"],
};
