import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "./src/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasToken = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value);
  const hasSelectedBusinessId = Boolean(request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value);
  const isPublicPath = PUBLIC_PATHS.has(pathname);
  const isOnboardingPath = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isBusinessSelectPath =
    pathname === "/business/select" || pathname.startsWith("/business/select/");

  if (!hasToken && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (hasToken && isPublicPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  if (hasToken && !hasSelectedBusinessId && !isBusinessSelectPath && !isOnboardingPath) {
    const selectBusinessUrl = request.nextUrl.clone();
    selectBusinessUrl.pathname = "/business/select";
    return NextResponse.redirect(selectBusinessUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
