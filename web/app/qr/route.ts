import { NextRequest, NextResponse } from "next/server";
import { MENU_TAGS_COOKIE_NAME } from "@/src/constants/menu";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const MAX_TAGS = 30;

function normalizeTag(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 64) return null;
  return normalized;
}

function parseTagsCookie(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split("|")
    .map((t) => normalizeTag(t))
    .filter((t): t is string => Boolean(t));
}

export function GET(request: NextRequest): NextResponse {
  const { searchParams } = request.nextUrl;

  const rawTags = searchParams.getAll("tag");
  const rawSource = searchParams.get("source");
  const menuId = searchParams.get("menuId")?.trim() || null;
  const promotionId = searchParams.get("promotionId")?.trim() || null;

  const incoming: string[] = [
    ...(rawSource ? [rawSource] : []),
    ...rawTags,
  ]
    .map((v) => normalizeTag(v))
    .filter((v): v is string => Boolean(v));

  const existing = parseTagsCookie(
    request.cookies.get(MENU_TAGS_COOKIE_NAME)?.value,
  );

  const merged = Array.from(new Set([...existing, ...incoming])).slice(-MAX_TAGS);

  const redirectParams = new URLSearchParams();
  if (menuId) redirectParams.set("menuId", menuId);
  if (promotionId) redirectParams.set("promotionId", promotionId);
  const suffix = redirectParams.size > 0 ? `?${redirectParams.toString()}` : "";

  const response = NextResponse.redirect(new URL(`/${suffix}`, request.url));

  if (merged.length > 0) {
    response.cookies.set(MENU_TAGS_COOKIE_NAME, merged.join("|"), {
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  return response;
}
