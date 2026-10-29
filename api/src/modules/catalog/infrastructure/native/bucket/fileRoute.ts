import type { HttpResponse } from "../../../../../shared/http/types.js";
import { NextResponse } from "../shared/http.js";
import { getSignedBucketUrl } from "../lib/railwayBucket.js";

/** Signed links live an hour; browsers/CDNs may reuse the redirect for less. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const REDIRECT_CACHE_SECONDS = 50 * 60;

/**
 * GET /files/<key> — public entry point for bucket files (images saved on
 * products, modifiers, prizes…). The bucket is private, so this answers with a
 * 302 to a short-lived signed link; the saved URL itself never expires.
 * `encodedKey` is the raw path after `/files/`, e.g. `dashboard/1793…-photo.png`.
 */
export async function GET(encodedKey: string): Promise<HttpResponse> {
  let segments: string[];
  try {
    segments = encodedKey.split("/").map((segment) => decodeURIComponent(segment));
  } catch {
    return NextResponse.json({ error: "Invalid payload", field: "key" }, { status: 400 });
  }
  const key = segments.join("/");
  if (!key || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    return NextResponse.json({ error: "Invalid payload", field: "key" }, { status: 400 });
  }

  try {
    const location = await getSignedBucketUrl(key, SIGNED_URL_TTL_SECONDS);
    return {
      statusCode: 302,
      body: "",
      headers: {
        location,
        "cache-control": `public, max-age=${REDIRECT_CACHE_SECONDS}`,
      },
    };
  } catch (error) {
    console.error("GET /files/:key error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
