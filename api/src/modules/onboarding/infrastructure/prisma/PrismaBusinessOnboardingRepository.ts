import prisma from "../../../../prisma.js";
import { randomUUID } from "node:crypto";
import type { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import type {
  BranchOnboardingRecord,
  BusinessOnboardingRecord,
  BusinessOnboardingRepository,
  UpsertBranchOnboardingInput,
  UpdateBusinessOnboardingInput,
  UpdateStripeStateInput,
} from "../../application/ports/BusinessOnboardingRepository.js";

export class PrismaBusinessOnboardingRepository
  implements BusinessOnboardingRepository
{
  async createBranch(
    businessId: string,
    input: UpsertBranchOnboardingInput,
  ): Promise<BranchOnboardingRecord> {
    return prisma.$transaction(async (tx) => {
      const addressData = toAddressWriteData(input, true);
      const address = await tx.address.create({
        data: addressData as never,
      });

      const branch = await tx.branch.create({
        data: {
          id: randomUUID(),
          businessId,
          name: input.name,
          operationHours: input.operationHours as Prisma.InputJsonValue,
          addressId: address.id,
        },
        include: {
          address: true,
        },
      });
      await persistBranchChatwootConfig(tx, branch.id, {
        chatwootAccountId: input.chatwootAccountId,
        chatwootSourceId: input.chatwootSourceId,
      });

      const chatwootConfig = await loadBranchChatwootConfigById(tx, branch.id);
      return mapBranch(branch, chatwootConfig);
    });
  }

  async findById(businessId: string): Promise<BusinessOnboardingRecord | null> {
    const rows = await prisma.$queryRaw<BusinessOnboardingRecord[]>`
      SELECT
        b."id",
        b."name",
        b."brandColor",
        b."logoUrl",
        b."bannerPhotoUrl",
        b."stripeAccountId",
        b."stripeDetailsSubmitted",
        b."stripeChargesEnabled",
        b."stripePayoutsEnabled",
        b."stripeOnboardingCompletedAt",
        b."onboardingCompletedAt"
      FROM "Business" b
      WHERE b."id" = ${businessId}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async listBranchesByBusinessId(businessId: string): Promise<BranchOnboardingRecord[]> {
    const rows = await prisma.branch.findMany({
      where: { businessId },
      include: {
        address: true,
      },
      orderBy: [{ createdAt: "asc" }],
    });
    const chatwootByBranchId = await loadBranchChatwootConfigsByIds(
      prisma,
      rows.map((row) => row.id),
    );

    return rows.map((row) => mapBranch(row, chatwootByBranchId.get(row.id) ?? null));
  }

  async removeBranch(businessId: string, branchId: string): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const branch = await tx.branch.findFirst({
        where: {
          id: branchId,
          businessId,
        },
        select: {
          id: true,
          addressId: true,
        },
      });

      if (!branch) return false;

      await tx.branch.delete({
        where: {
          id: branch.id,
        },
      });

      if (branch.addressId) {
        await tx.address.delete({
          where: {
            id: branch.addressId,
          },
        });
      }

      return true;
    });
  }

  async updateBasicInfo(
    businessId: string,
    input: UpdateBusinessOnboardingInput,
  ): Promise<BusinessOnboardingRecord | null> {
    const rows = await prisma.$queryRaw<BusinessOnboardingRecord[]>`
      UPDATE "Business"
      SET
        "name" = ${input.name},
        "brandColor" = ${input.brandColor},
        "logoUrl" = ${input.logoUrl},
        "bannerPhotoUrl" = ${input.bannerPhotoUrl},
        "updatedAt" = NOW()
      WHERE "id" = ${businessId}
      RETURNING
        "id",
        "name",
        "brandColor",
        "logoUrl",
        "bannerPhotoUrl",
        "stripeAccountId",
        "stripeDetailsSubmitted",
        "stripeChargesEnabled",
        "stripePayoutsEnabled",
        "stripeOnboardingCompletedAt",
        "onboardingCompletedAt"
    `;

    return rows[0] ?? null;
  }

  async updateBranch(
    businessId: string,
    branchId: string,
    input: UpsertBranchOnboardingInput,
  ): Promise<BranchOnboardingRecord | null> {
    return prisma.$transaction(async (tx) => {
      const branch = await tx.branch.findFirst({
        where: {
          id: branchId,
          businessId,
        },
        include: {
          address: true,
        },
      });
      if (!branch) {
        return null;
      }

      let addressId = branch.addressId;
      if (!addressId) {
        const addressData = toAddressWriteData(input, true);
        const address = await tx.address.create({
          data: addressData as never,
        });
        addressId = address.id;
      } else {
        const addressData = toAddressWriteData(input, false);
        await tx.address.update({
          where: {
            id: addressId,
          },
          data: addressData as never,
        });
      }

      const updated = await tx.branch.update({
        where: {
          id: branchId,
        },
        data: {
          name: input.name,
          operationHours: input.operationHours as Prisma.InputJsonValue,
          addressId,
        },
        include: {
          address: true,
        },
      });
      await persistBranchChatwootConfig(tx, updated.id, {
        chatwootAccountId: input.chatwootAccountId,
        chatwootSourceId: input.chatwootSourceId,
      });

      const chatwootConfig = await loadBranchChatwootConfigById(tx, updated.id);
      return mapBranch(updated, chatwootConfig);
    });
  }

  async updateStripeState(
    businessId: string,
    input: UpdateStripeStateInput,
  ): Promise<BusinessOnboardingRecord | null> {
    const rows = await prisma.$queryRaw<BusinessOnboardingRecord[]>`
      UPDATE "Business"
      SET
        "stripeAccountId" = ${input.stripeAccountId},
        "stripeDetailsSubmitted" = ${input.stripeDetailsSubmitted},
        "stripeChargesEnabled" = ${input.stripeChargesEnabled},
        "stripePayoutsEnabled" = ${input.stripePayoutsEnabled},
        "stripeOnboardingCompletedAt" = ${input.stripeOnboardingCompletedAt},
        "onboardingCompletedAt" = ${input.onboardingCompletedAt},
        "updatedAt" = NOW()
      WHERE "id" = ${businessId}
      RETURNING
        "id",
        "name",
        "brandColor",
        "logoUrl",
        "bannerPhotoUrl",
        "stripeAccountId",
        "stripeDetailsSubmitted",
        "stripeChargesEnabled",
        "stripePayoutsEnabled",
        "stripeOnboardingCompletedAt",
        "onboardingCompletedAt"
    `;

    return rows[0] ?? null;
  }
}

function mapBranch(branch: {
  id: string;
  name: string;
  createdAt: Date;
  operationHours: unknown;
  address?: {
    id: string;
    description: string;
    googleMapsUrl: string;
    [key: string]: unknown;
  } | null;
},
chatwootConfig?: {
  chatwootAccountId: string | null;
  chatwootSourceId: string | null;
} | null): BranchOnboardingRecord {
  const addressRecord = toObjectRecord(branch.address);

  return {
    id: branch.id,
    name: branch.name,
    createdAt: branch.createdAt,
    chatwootAccountId: chatwootConfig?.chatwootAccountId ?? null,
    chatwootSourceId: chatwootConfig?.chatwootSourceId ?? null,
    operationHours: branch.operationHours,
    address: branch.address
      ? {
          id: branch.address.id,
          description: branch.address.description,
          googleMapsUrl: branch.address.googleMapsUrl,
          lat: readNullableString(addressRecord?.lat),
          lng: readNullableString(addressRecord?.lng),
          city: readNullableString(addressRecord?.city),
          zipCode: readNullableString(addressRecord?.zipCode),
          state: readNullableString(addressRecord?.State),
          street: readNullableString(addressRecord?.street),
          number: readNullableString(addressRecord?.number),
          complement: readNullableString(addressRecord?.complement),
          numberComplement: readNullableString(addressRecord?.numberComplement),
          placeId: readNullableString(addressRecord?.placeId),
        }
      : null,
  };
}

function toAddressWriteData(
  input: UpsertBranchOnboardingInput,
  includeId: boolean,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    description: input.addressDescription,
    googleMapsUrl: input.addressGoogleMapsUrl,
    lat: typeof input.addressLatitude === "number" ? String(input.addressLatitude) : null,
    lng: typeof input.addressLongitude === "number" ? String(input.addressLongitude) : null,
    city: input.addressCity ?? null,
    zipCode: input.addressZipCode ?? null,
    State: input.addressState ?? null,
    street: input.addressStreet ?? null,
    number: input.addressNumber ?? null,
    complement: input.addressComplement ?? null,
    numberComplement: input.addressNumberComplement ?? null,
    placeId: input.addressPlaceId ?? null,
  };
  if (includeId) {
    data.id = randomUUID();
  }
  return data;
}

type RawQueryClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
  $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>;
};

async function persistBranchChatwootConfig(
  tx: RawQueryClient,
  branchId: string,
  input: {
    chatwootAccountId?: string | null;
    chatwootSourceId?: string | null;
  },
): Promise<void> {
  const availability = await getBranchChatwootColumnsAvailability(tx);

  const sets: string[] = [];
  const values: unknown[] = [];

  if (availability.hasChatwootAccountId && input.chatwootAccountId !== undefined) {
    sets.push(`"chatwootAccountId" = $${values.length + 1}`);
    values.push(input.chatwootAccountId);
  }

  if (availability.hasChatwootSourceId && input.chatwootSourceId !== undefined) {
    sets.push(`"chatwootSourceId" = $${values.length + 1}`);
    values.push(input.chatwootSourceId);
  }

  if (sets.length === 0) {
    return;
  }

  await tx.$executeRawUnsafe(
    `UPDATE "Branch" SET ${sets.join(", ")} WHERE "id" = $${values.length + 1}`,
    ...values,
    branchId,
  );
}

async function loadBranchChatwootConfigById(
  tx: RawQueryClient,
  branchId: string,
): Promise<{ chatwootAccountId: string | null; chatwootSourceId: string | null } | null> {
  const availability = await getBranchChatwootColumnsAvailability(tx);
  if (!availability.hasChatwootAccountId && !availability.hasChatwootSourceId) {
    return null;
  }

  const selectChatwootAccount = availability.hasChatwootAccountId
    ? `"chatwootAccountId"`
    : "NULL::text";
  const selectChatwootSource = availability.hasChatwootSourceId
    ? `"chatwootSourceId"`
    : "NULL::text";

  const rows = await tx.$queryRawUnsafe<
    Array<{
      chatwootAccountId: string | null;
      chatwootSourceId: string | null;
    }>
  >(
    `
    SELECT
      ${selectChatwootAccount} AS "chatwootAccountId",
      ${selectChatwootSource} AS "chatwootSourceId"
    FROM "Branch"
    WHERE "id" = $1
    LIMIT 1
  `,
    branchId,
  );

  return rows[0] ?? null;
}

async function loadBranchChatwootConfigsByIds(
  tx: RawQueryClient,
  branchIds: string[],
): Promise<Map<string, { chatwootAccountId: string | null; chatwootSourceId: string | null }>> {
  if (branchIds.length === 0) {
    return new Map();
  }
  const availability = await getBranchChatwootColumnsAvailability(tx);
  if (!availability.hasChatwootAccountId && !availability.hasChatwootSourceId) {
    return new Map();
  }

  const selectChatwootAccount = availability.hasChatwootAccountId
    ? `"chatwootAccountId"`
    : "NULL::text";
  const selectChatwootSource = availability.hasChatwootSourceId
    ? `"chatwootSourceId"`
    : "NULL::text";

  const rows = await tx.$queryRawUnsafe<
    Array<{
      id: string;
      chatwootAccountId: string | null;
      chatwootSourceId: string | null;
    }>
  >(
    `
    SELECT
      "id",
      ${selectChatwootAccount} AS "chatwootAccountId",
      ${selectChatwootSource} AS "chatwootSourceId"
    FROM "Branch"
    WHERE "id" = ANY($1::text[])
  `,
    branchIds,
  );

  return new Map(
    rows.map((row) => [
      row.id,
      {
        chatwootAccountId: row.chatwootAccountId,
        chatwootSourceId: row.chatwootSourceId,
      },
    ]),
  );
}

async function getBranchChatwootColumnsAvailability(
  tx: RawQueryClient,
): Promise<{ hasChatwootAccountId: boolean; hasChatwootSourceId: boolean }> {
  const rows = await tx.$queryRaw<Array<{ columnName: string }>>`
    SELECT c.column_name AS "columnName"
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'Branch'
      AND c.column_name IN ('chatwootAccountId', 'chatwootSourceId')
  `;

  const set = new Set(rows.map((row) => row.columnName));
  return {
    hasChatwootAccountId: set.has("chatwootAccountId"),
    hasChatwootSourceId: set.has("chatwootSourceId"),
  };
}

function toObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}
