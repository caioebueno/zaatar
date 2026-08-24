import prisma from "../../../../../prisma.js";
import { Prisma } from "../../../../../../../web/src/generated/prisma/index.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";
import { enqueueSquareModifierGroupSync } from "../shared/squareCatalogSync.js";
import {
  mapSquareSyncTask,
  mapSquareSyncTasks,
  type SquareSyncTaskResponse,
} from "../shared/squareSyncTask.js";

type RouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

type PatchBody = {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  translations?: unknown;
  modifierGroupId?: unknown;
  fileId?: unknown;
  photoUrl?: unknown;
};

type ModifierGroupItemResponse = {
  description: string | null;
  id: string;
  modifierGroupId: string | null;
  name: string;
  photo: {
    id: string;
    url: string;
  } | null;
  price: number;
  squareSyncTask: SquareSyncTaskResponse | null;
  squareSyncTasks: SquareSyncTaskResponse[];
  translations: unknown | null;
};

function parseString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(field);
  }

  return normalized;
}

function parseNullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  return normalized || null;
}

function createId() {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildFileNameFromUrl(urlValue: string): string {
  try {
    const parsed = new URL(urlValue);
    const rawFileName = parsed.pathname.split("/").filter(Boolean).pop();
    if (rawFileName) {
      return decodeURIComponent(rawFileName);
    }
  } catch {
    // no-op
  }

  return "modifier-item-image";
}

function parseNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(field);
  }

  if (value < 0) {
    throw new Error(field);
  }

  return value;
}

export async function PATCH(request: NextRequestLike, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const normalizedItemId = itemId.trim();
    const businessId = request.headers?.["x-business-id"]?.trim() || null;

    if (!normalizedItemId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "itemId" },
        { status: 400 },
      );
    }

    const existingItem = await prisma.modifierGroupItem.findUnique({
      where: {
        id: normalizedItemId,
      },
      select: {
        id: true,
        modifierGroupId: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Modifier group item not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as PatchBody;
    const data: Prisma.ModifierGroupItemUpdateInput = {};
    let hasAnyField = false;

    if (body.fileId !== undefined && body.photoUrl !== undefined) {
      return NextResponse.json(
        { error: "Invalid payload", field: "photoUrl" },
        { status: 400 },
      );
    }

    if (body.name !== undefined) {
      data.name = parseString(body.name, "name");
      hasAnyField = true;
    }

    if (body.description !== undefined) {
      data.description = parseNullableString(body.description, "description");
      hasAnyField = true;
    }

    if (body.price !== undefined) {
      data.price = parseNonNegativeInteger(body.price, "price");
      hasAnyField = true;
    }

    if (body.modifierGroupId !== undefined) {
      const modifierGroupId = parseNullableString(
        body.modifierGroupId,
        "modifierGroupId",
      );

      if (modifierGroupId) {
        const modifierGroup = await prisma.modifierGroup.findUnique({
          where: {
            id: modifierGroupId,
          },
          select: {
            id: true,
          },
        });

        if (!modifierGroup) {
          return NextResponse.json(
            { error: "Invalid payload", field: "modifierGroupId" },
            { status: 400 },
          );
        }

        data.modifierGroup = {
          connect: {
            id: modifierGroupId,
          },
        };
      } else {
        data.modifierGroup = {
          disconnect: true,
        };
      }

      hasAnyField = true;
    }

    if (body.translations !== undefined) {
      if (
        body.translations !== null &&
        (typeof body.translations !== "object" ||
          Array.isArray(body.translations))
      ) {
        return NextResponse.json(
          { error: "Invalid payload", field: "translations" },
          { status: 400 },
        );
      }

      data.translations =
        body.translations === null
          ? Prisma.JsonNull
          : (body.translations as Prisma.InputJsonValue);
      hasAnyField = true;
    }

    if (body.fileId !== undefined) {
      const fileId = parseNullableString(body.fileId, "fileId");

      if (fileId) {
        const file = await prisma.file.findUnique({
          where: {
            id: fileId,
          },
          select: {
            id: true,
          },
        });

        if (!file) {
          return NextResponse.json(
            { error: "Invalid payload", field: "fileId" },
            { status: 400 },
          );
        }

        data.photo = {
          connect: {
            id: fileId,
          },
        };
      } else {
        data.photo = {
          disconnect: true,
        };
      }

      hasAnyField = true;
    }

    if (body.photoUrl !== undefined) {
      const photoUrl = parseNullableString(body.photoUrl, "photoUrl");

      if (photoUrl) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(photoUrl);
        } catch {
          return NextResponse.json(
            { error: "Invalid payload", field: "photoUrl" },
            { status: 400 },
          );
        }

        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          return NextResponse.json(
            { error: "Invalid payload", field: "photoUrl" },
            { status: 400 },
          );
        }

        const normalizedPhotoUrl = parsedUrl.toString();
        const existingFile = await prisma.file.findFirst({
          where: {
            url: normalizedPhotoUrl,
          },
          select: {
            id: true,
          },
        });

        const fileId =
          existingFile?.id ||
          (
            await prisma.file.create({
              data: {
                id: createId(),
                name: buildFileNameFromUrl(normalizedPhotoUrl),
                url: normalizedPhotoUrl,
                size: 0,
              },
              select: {
                id: true,
              },
            })
          ).id;

        data.photo = {
          connect: {
            id: fileId,
          },
        };
      } else {
        data.photo = {
          disconnect: true,
        };
      }

      hasAnyField = true;
    }

    if (!hasAnyField) {
      return NextResponse.json(
        { error: "Invalid payload", field: "body" },
        { status: 400 },
      );
    }

    const updatedItem = await prisma.modifierGroupItem.update({
      where: {
        id: normalizedItemId,
      },
      data,
      select: {
        id: true,
        modifierGroupId: true,
        name: true,
        description: true,
        price: true,
        translations: true,
        photo: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    const squareSyncTasks = await enqueueSquareModifierGroupSync({
      businessId,
      modifierGroupIds: [
        existingItem.modifierGroupId ?? "",
        updatedItem.modifierGroupId ?? "",
      ],
      requestPayload: {
        source: "MODIFIER_GROUP_ITEM_PATCH",
        modifierGroupItemId: normalizedItemId,
        previousModifierGroupId: existingItem.modifierGroupId ?? null,
        nextModifierGroupId: updatedItem.modifierGroupId ?? null,
        triggeredAt: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      serializeModifierGroupItemResponse(updatedItem, squareSyncTasks),
    );
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Modifier group item not found" },
        { status: 404 },
      );
    }

    console.error("PATCH /api/modifier-group-items/[itemId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

function serializeModifierGroupItemResponse(
  item: {
    description: string | null;
    id: string;
    modifierGroupId: string | null;
    name: string;
    photo: {
      id: string;
      url: string;
    } | null;
    price: number;
    translations: unknown | null;
  },
  squareSyncTasks: Parameters<typeof mapSquareSyncTasks>[0] = [],
): ModifierGroupItemResponse {
  const serializedTasks = mapSquareSyncTasks(squareSyncTasks);

  return {
    ...item,
    squareSyncTask: serializedTasks[0] ?? null,
    squareSyncTasks: serializedTasks,
  };
}

export async function DELETE(
  request: NextRequestLike,
  context: RouteContext,
) {
  try {
    const { itemId } = await context.params;
    const normalizedItemId = itemId.trim();
    const businessId = request.headers?.["x-business-id"]?.trim() || null;

    if (!normalizedItemId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "itemId" },
        { status: 400 },
      );
    }

    const existingItem = await prisma.modifierGroupItem.findUnique({
      where: {
        id: normalizedItemId,
      },
      select: {
        id: true,
        modifierGroupId: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Modifier group item not found" },
        { status: 404 },
      );
    }

    await enqueueSquareModifierGroupSync({
      businessId,
      modifierGroupIds: [existingItem.modifierGroupId ?? ""],
      requestPayload: {
        source: "MODIFIER_GROUP_ITEM_DELETE",
        modifierGroupItemId: normalizedItemId,
        previousModifierGroupId: existingItem.modifierGroupId ?? null,
        triggeredAt: new Date().toISOString(),
      },
    });

    const updatedItem = await prisma.modifierGroupItem.update({
      where: {
        id: normalizedItemId,
      },
      data: {
        modifierGroup: {
          disconnect: true,
        },
      },
      select: {
        id: true,
        modifierGroupId: true,
        name: true,
        description: true,
        price: true,
        translations: true,
        photo: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedItem,
      deleted: true,
      disconnected: true,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Modifier group item not found" },
        { status: 404 },
      );
    }

    console.error("DELETE /api/modifier-group-items/[itemId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
