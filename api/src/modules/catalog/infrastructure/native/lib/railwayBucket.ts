import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName =
  process.env.RAILWAY_BUCKET_NAME?.trim() || process.env.BUCKET?.trim() || "";
const bucketRegion =
  process.env.RAILWAY_BUCKET_REGION?.trim() ||
  process.env.REGION?.trim() ||
  "auto";
const bucketEndpoint =
  process.env.RAILWAY_BUCKET_ENDPOINT?.trim() ||
  process.env.ENDPOINT?.trim() ||
  "";
const bucketPublicBaseUrl =
  process.env.RAILWAY_BUCKET_PUBLIC_BASE_URL?.trim() ||
  process.env.BUCKET_PUBLIC_BASE_URL?.trim() ||
  "";
const accessKeyId =
  process.env.RAILWAY_BUCKET_ACCESS_KEY_ID?.trim() ||
  process.env.ACCESS_KEY_ID?.trim() ||
  "";
const secretAccessKey =
  process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY?.trim() ||
  process.env.SECRET_ACCESS_KEY?.trim() ||
  "";
const forcePathStyle =
  process.env.RAILWAY_BUCKET_FORCE_PATH_STYLE === "true";

const isConfigured =
  bucketName.length > 0 &&
  bucketEndpoint.length > 0 &&
  accessKeyId.length > 0 &&
  secretAccessKey.length > 0;

const bucketClient = isConfigured
  ? new S3Client({
      region: bucketRegion,
      endpoint: bucketEndpoint,
      forcePathStyle,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

function getBucketClient(): S3Client {
  if (!isConfigured || !bucketClient) {
    throw new Error(
      "Bucket is not configured. Set BUCKET, ENDPOINT, ACCESS_KEY_ID, and SECRET_ACCESS_KEY.",
    );
  }

  return bucketClient;
}

function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function inferExtension(contentType: string, originalName: string): string {
  const normalizedName = originalName.toLowerCase();

  if (normalizedName.includes(".")) {
    const ext = normalizedName.split(".").pop();
    if (ext && /^[a-z0-9]{2,8}$/.test(ext)) {
      return ext;
    }
  }

  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/svg+xml") return "svg";

  return "bin";
}

export function createBucketObjectKey(fileName: string, contentType: string): string {
  const extension = inferExtension(contentType, fileName);
  const baseName = sanitizeFileName(fileName.replace(/\.[^.]+$/, "")) || "image";
  const randomId =
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `dashboard/${Date.now()}-${randomId}-${baseName}.${extension}`;
}

export async function uploadImageToBucket(input: {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
  publicRead?: boolean;
}): Promise<void> {
  const client = getBucketClient();

  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
    CacheControl: input.cacheControl ?? "public, max-age=31536000, immutable",
    ...(input.publicRead !== false ? { ACL: "public-read" as const } : {}),
  };

  try {
    await client.send(new PutObjectCommand(params));
  } catch (error) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      typeof error.name === "string"
        ? error.name
        : null;

    // Some S3-compatible buckets disable ACLs at bucket level.
    if (errorCode === "AccessControlListNotSupported") {
      const fallbackParams: PutObjectCommandInput = {
        ...params,
      };
      delete fallbackParams.ACL;
      await client.send(new PutObjectCommand(fallbackParams));
      return;
    }

    throw error;
  }
}

export async function getImageFromBucket(key: string) {
  const client = getBucketClient();

  return client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
}

/**
 * Short-lived GET link for a private object. Railway buckets can't serve public
 * objects (public-read ACLs are ignored), so every read goes through one of these.
 */
export async function getSignedBucketUrl(key: string, expiresInSeconds: number): Promise<string> {
  return getSignedUrl(getBucketClient(), new GetObjectCommand({ Bucket: bucketName, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}

export function getBucketProxyUrl(origin: string, key: string): string {
  return `${origin}${getBucketProxyPath(key)}`;
}

export function getBucketProxyPath(key: string): string {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `/api/bucket/${encodedKey}`;
}

/**
 * Public URL of an object: BUCKET_PUBLIC_BASE_URL plus the object key as the
 * path. BUCKET_PUBLIC_BASE_URL is this API's `GET /files` route (e.g.
 * `https://api.example.com/files`), which maps the path straight onto the key,
 * presigns it and redirects — so nothing else goes in the path.
 */
export function getBucketPublicUrl(key: string): string {
  if (!bucketPublicBaseUrl) {
    throw new Error("Bucket public URL is not configured. Set BUCKET_PUBLIC_BASE_URL.");
  }

  const baseUrl = bucketPublicBaseUrl.replace(/\/+$/, "");
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/${encodedKey}`;
}
