import { randomUUID } from "node:crypto";
import type {
  SquareBatchDeleteResult,
  SquareBatchRetrieveResult,
  SquareBatchUpsertResult,
  SquareCatalogImageCreateResult,
  SquareCatalogGateway,
} from "../../application/ports/SquareCatalogGateway.js";

type SquareBatchUpsertApiResponse = {
  errors?: Array<{ code?: string; detail?: string; category?: string }>;
  id_mappings?: Array<{
    client_object_id?: string | null;
    object_id?: string | null;
  }>;
  [key: string]: unknown;
};

type SquareBatchDeleteApiResponse = {
  deleted_at?: string | null;
  deleted_object_ids?: string[] | null;
  errors?: Array<{ code?: string; detail?: string; category?: string }>;
  [key: string]: unknown;
};

type SquareBatchRetrieveApiResponse = {
  objects?: unknown[] | null;
  related_objects?: unknown[] | null;
  errors?: Array<{ code?: string; detail?: string; category?: string }>;
  [key: string]: unknown;
};

type SquareCreateCatalogImageApiResponse = {
  errors?: Array<{ code?: string; detail?: string; category?: string }>;
  image?: {
    id?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

const DEFAULT_SQUARE_VERSION = "2026-07-15";
const SQUARE_BATCH_UPSERT_LIMIT = 1_000;
const SQUARE_SUPPORTED_IMAGE_CONTENT_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
]);

export class HttpSquareCatalogGateway implements SquareCatalogGateway {
  async batchUpsertCatalogObjects(input: {
    accessToken?: string;
    idempotencyKey: string;
    objects: unknown[];
  }): Promise<SquareBatchUpsertResult> {
    const accessToken = resolveSquareAccessToken(input.accessToken);
    if (!accessToken) {
      throw new Error("SQUARE_ACCESS_TOKEN_NOT_CONFIGURED");
    }

    const response = await fetch(`${resolveSquareApiBaseUrl()}/v2/catalog/batch-upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": process.env.SQUARE_API_VERSION?.trim() || DEFAULT_SQUARE_VERSION,
      },
      body: JSON.stringify({
        idempotency_key: input.idempotencyKey,
        batches: chunkCatalogObjects(input.objects).map((objects) => ({
          objects,
        })),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as SquareBatchUpsertApiResponse;

    if (!response.ok) {
      const detail = payload.errors?.[0]?.detail?.trim();
      throw new Error(
        detail
          ? `SQUARE_SYNC_FAILED_${response.status}: ${detail}`
          : `SQUARE_SYNC_FAILED_${response.status}`,
      );
    }

    return {
      rawResponse: payload,
      idMappings: (payload.id_mappings ?? []).map((mapping) => ({
        clientObjectId: mapping.client_object_id ?? null,
        objectId: mapping.object_id ?? null,
      })),
    };
  }

  async batchDeleteCatalogObjects(input: {
    accessToken?: string;
    objectIds: string[];
  }): Promise<SquareBatchDeleteResult> {
    const accessToken = resolveSquareAccessToken(input.accessToken);
    if (!accessToken) {
      throw new Error("SQUARE_ACCESS_TOKEN_NOT_CONFIGURED");
    }

    const response = await fetch(`${resolveSquareApiBaseUrl()}/v2/catalog/batch-delete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": process.env.SQUARE_API_VERSION?.trim() || DEFAULT_SQUARE_VERSION,
      },
      body: JSON.stringify({
        object_ids: input.objectIds,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as SquareBatchDeleteApiResponse;

    if (!response.ok) {
      const detail = payload.errors?.[0]?.detail?.trim();
      throw new Error(
        detail
          ? `SQUARE_DELETE_FAILED_${response.status}: ${detail}`
          : `SQUARE_DELETE_FAILED_${response.status}`,
      );
    }

    return {
      deletedAt: payload.deleted_at ?? null,
      deletedObjectIds: (payload.deleted_object_ids ?? []).filter(
        (objectId): objectId is string => typeof objectId === "string" && objectId.trim().length > 0,
      ),
    };
  }

  async batchRetrieveCatalogObjects(input: {
    accessToken?: string;
    includeRelatedObjects?: boolean;
    objectIds: string[];
  }): Promise<SquareBatchRetrieveResult> {
    const accessToken = resolveSquareAccessToken(input.accessToken);
    if (!accessToken) {
      throw new Error("SQUARE_ACCESS_TOKEN_NOT_CONFIGURED");
    }

    const response = await fetch(`${resolveSquareApiBaseUrl()}/v2/catalog/batch-retrieve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": process.env.SQUARE_API_VERSION?.trim() || DEFAULT_SQUARE_VERSION,
      },
      body: JSON.stringify({
        object_ids: input.objectIds,
        include_related_objects: input.includeRelatedObjects === true,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as SquareBatchRetrieveApiResponse;

    if (!response.ok) {
      const detail = payload.errors?.[0]?.detail?.trim();
      throw new Error(
        detail
          ? `SQUARE_RETRIEVE_FAILED_${response.status}: ${detail}`
          : `SQUARE_RETRIEVE_FAILED_${response.status}`,
      );
    }

    return {
      objects: Array.isArray(payload.objects) ? payload.objects : [],
      relatedObjects: Array.isArray(payload.related_objects) ? payload.related_objects : [],
    };
  }

  async createCatalogImageFromUrl(input: {
    accessToken?: string;
    caption?: string;
    imageName?: string;
    imageUrl: string;
    isPrimary?: boolean;
    objectId: string;
  }): Promise<SquareCatalogImageCreateResult> {
    const accessToken = resolveSquareAccessToken(input.accessToken);
    if (!accessToken) {
      throw new Error("SQUARE_ACCESS_TOKEN_NOT_CONFIGURED");
    }

    const imageResponse = await fetch(input.imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`SQUARE_IMAGE_FETCH_FAILED_${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const fileName = buildFileNameFromUrl(input.imageUrl);
    const contentType = imageBlob.type?.trim() || "application/octet-stream";

    if (!SQUARE_SUPPORTED_IMAGE_CONTENT_TYPES.has(contentType)) {
      console.warn(
        `[square-image-sync] skipping unsupported image content type "${contentType}" for ${input.imageUrl}`,
      );

      return {
        imageId: null,
        rawResponse: {
          skipped: true,
          reason: "UNSUPPORTED_IMAGE_CONTENT_TYPE",
          contentType,
          imageUrl: input.imageUrl,
        },
      };
    }

    const file = new File([imageBlob], fileName, { type: contentType });

    const formData = new FormData();
    formData.set("file", file);
    formData.set(
      "request",
      JSON.stringify({
        idempotency_key: randomUUID(),
        object_id: input.objectId,
        is_primary: input.isPrimary === true,
        image: {
          id: `#foody-image-${randomUUID()}`,
          type: "IMAGE",
          image_data: {
            ...(input.imageName?.trim() ? { name: input.imageName.trim() } : {}),
            ...(input.caption?.trim() ? { caption: input.caption.trim() } : {}),
          },
        },
      }),
    );

    const response = await fetch(`${resolveSquareApiBaseUrl()}/v2/catalog/images`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": process.env.SQUARE_API_VERSION?.trim() || DEFAULT_SQUARE_VERSION,
      },
      body: formData,
    });

    const payload =
      (await response.json().catch(() => ({}))) as SquareCreateCatalogImageApiResponse;

    if (!response.ok) {
      const detail = payload.errors?.[0]?.detail?.trim();
      throw new Error(
        detail
          ? `SQUARE_IMAGE_SYNC_FAILED_${response.status}: ${detail}`
          : `SQUARE_IMAGE_SYNC_FAILED_${response.status}`,
      );
    }

    return {
      imageId: payload.image?.id?.trim() ?? null,
      rawResponse: payload,
    };
  }
}

function chunkCatalogObjects(objects: unknown[]): unknown[][] {
  if (objects.length <= SQUARE_BATCH_UPSERT_LIMIT) {
    return [objects];
  }

  const chunks: unknown[][] = [];

  for (let index = 0; index < objects.length; index += SQUARE_BATCH_UPSERT_LIMIT) {
    chunks.push(objects.slice(index, index + SQUARE_BATCH_UPSERT_LIMIT));
  }

  return chunks;
}

function resolveSquareApiBaseUrl(): string {
  const configured = process.env.SQUARE_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const environment = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return environment === "PRODUCTION"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function resolveSquareAccessToken(accessToken?: string): string | null {
  const provided = accessToken?.trim();
  if (provided) {
    return provided;
  }

  const configured = process.env.SQUARE_ACCESS_TOKEN?.trim();
  return configured || null;
}

function buildFileNameFromUrl(urlValue: string): string {
  try {
    const parsed = new URL(urlValue);
    const rawFileName = parsed.pathname.split("/").filter(Boolean).pop();
    if (rawFileName) {
      return decodeURIComponent(rawFileName);
    }
  } catch {
    return "image";
  }

  return "image";
}
