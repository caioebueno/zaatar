import { NextRequest, NextResponse } from "next/server";
import { getImageFromBucket } from "@/src/lib/railwayBucket";

type RouteContext = {
  params: Promise<{
    key: string[];
  }>;
};

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const keyParts = (await context.params).key;

    if (!Array.isArray(keyParts) || keyParts.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload", field: "key" },
        { status: 400 },
      );
    }

    const key = keyParts.join("/");
    const object = await getImageFromBucket(key);

    if (!object.Body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const contentType = object.ContentType || "application/octet-stream";
    const cacheControl = object.CacheControl || "public, max-age=31536000, immutable";

    if (typeof object.Body.transformToWebStream === "function") {
      return new NextResponse(object.Body.transformToWebStream(), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": cacheControl,
        },
      });
    }

    const bytes = await object.Body.transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    const isNotFound =
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: string }).name === "NoSuchKey";

    if (isNotFound) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.error("GET /api/bucket/[...key] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
