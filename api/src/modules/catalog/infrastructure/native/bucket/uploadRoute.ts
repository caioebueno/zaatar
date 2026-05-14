import type { HttpResponse } from "../../../../../shared/http/types.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";
import {
  createBucketObjectKey,
  getBucketProxyPath,
  uploadImageToBucket,
} from "../lib/railwayBucket.js";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export const runtime = "nodejs";

export async function POST(request: NextRequestLike) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Invalid payload", field: "file" },
        { status: 400 },
      );
    }

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          field: "file",
          reason: "Unsupported image type",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          field: "file",
          reason: "File too large (max 10MB)",
        },
        { status: 400 },
      );
    }

    const key = createBucketObjectKey(file.name, file.type);
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadImageToBucket({
      key,
      body: buffer,
      contentType: file.type,
    });

    return NextResponse.json(
      {
        key,
        url: getBucketProxyPath(key),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/bucket/upload error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
