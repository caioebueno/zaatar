import { NextRequest, NextResponse } from "next/server";
import {
  MENU_ID_COOKIE_NAME,
  MENU_ID_HEADER_NAME,
  MENU_TAGS_COOKIE_NAME,
  PROMOTION_ID_COOKIE_NAME,
  PROMOTION_ID_HEADER_NAME,
} from "./src/constants/menu";
import {
  BUSINESS_ID_COOKIE_NAME,
  BUSINESS_ID_HEADER_NAME,
  getConfiguredBusinessId,
} from "./src/constants/business";

const CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_HEADERS = "Content-Type, Authorization";
const MENU_CONTEXT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const MAX_MENU_TAGS_PER_BROWSER = 30;

function normalizeTag(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.length > 64) return null;
  return normalized;
}

function parseMenuTagsCookie(value: string | undefined): string[] {
  if (!value) return [];

  return value
    .split("|")
    .map((item) => normalizeTag(item))
    .filter((item): item is string => Boolean(item));
}

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
  const configuredBusinessId = getConfiguredBusinessId();

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
  const hasTagQueryParam = isMenuRoute
    ? request.nextUrl.searchParams.has("tag")
    : false;
  const tagsFromQuery = hasTagQueryParam
    ? request.nextUrl.searchParams
        .getAll("tag")
        .map((tag) => normalizeTag(tag))
        .filter((tag): tag is string => Boolean(tag))
    : [];

  if (menuIdFromQuery) {
    requestHeaders.set(MENU_ID_HEADER_NAME, menuIdFromQuery);
  }
  if (configuredBusinessId) {
    requestHeaders.set(BUSINESS_ID_HEADER_NAME, configuredBusinessId);
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
  if (configuredBusinessId) {
    response.cookies.set(BUSINESS_ID_COOKIE_NAME, configuredBusinessId, {
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
  if (hasTagQueryParam && tagsFromQuery.length > 0) {
    const existingTags = parseMenuTagsCookie(
      request.cookies.get(MENU_TAGS_COOKIE_NAME)?.value,
    );
    const mergedTags = Array.from(new Set([...existingTags, ...tagsFromQuery])).slice(
      -MAX_MENU_TAGS_PER_BROWSER,
    );

    if (mergedTags.length > 0) {
      response.cookies.set(MENU_TAGS_COOKIE_NAME, mergedTags.join("|"), {
        sameSite: "lax",
        path: "/",
        maxAge: MENU_CONTEXT_COOKIE_MAX_AGE_SECONDS,
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/menu/:path*"],
};
