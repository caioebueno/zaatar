import prisma from "../../../../prisma.js";
import type {
  BusinessSettingsRecord,
  BusinessSettingsRepository,
  UpdateBusinessSettingsInput,
} from "../../application/ports/BusinessSettingsRepository.js";

export class PrismaBusinessSettingsRepository
  implements BusinessSettingsRepository
{
  async findById(
    businessId: string,
    branchId?: string | null,
  ): Promise<BusinessSettingsRecord | null> {
    const rows = await prisma.$queryRaw<Omit<
      BusinessSettingsRecord,
      "showUpsellModalOnAddToCart"
    >[]>`
      SELECT
        b."id",
        b."name",
        b."brandColor",
        b."logoUrl",
        b."bannerPhotoUrl"
      FROM "Business" b
      WHERE b."id" = ${businessId}
      LIMIT 1
    `;

    const business = rows[0] ?? null;
    if (!business) {
      return null;
    }

    return {
      ...business,
      showUpsellModalOnAddToCart: await this.getBranchUpsellFlag(
        businessId,
        branchId,
      ),
    };
  }

  async updateById(
    businessId: string,
    input: UpdateBusinessSettingsInput,
  ): Promise<BusinessSettingsRecord | null> {
    const rows = await prisma.$queryRaw<BusinessSettingsRecord[]>`
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
        "bannerPhotoUrl"
    `;

    const business = rows[0] ?? null;
    if (!business) {
      return null;
    }

    return {
      ...business,
      showUpsellModalOnAddToCart: false,
    };
  }

  private async getBranchUpsellFlag(
    businessId: string,
    branchId?: string | null,
  ): Promise<boolean> {
    const normalizedBranchId = branchId?.trim();
    if (!normalizedBranchId || !(await hasBranchShowUpsellModalColumn())) {
      return false;
    }

    const rows = await prisma.$queryRawUnsafe<
      Array<{ showUpsellModalOnAddToCart: boolean | null }>
    >(
      `
      SELECT "showUpsellModalOnAddToCart"
      FROM "Branch"
      WHERE "id" = $1
        AND "businessId" = $2
      LIMIT 1
    `,
      normalizedBranchId,
      businessId,
    );

    return rows[0]?.showUpsellModalOnAddToCart === true;
  }
}

async function hasBranchShowUpsellModalColumn(): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Branch'
        AND column_name = 'showUpsellModalOnAddToCart'
    ) AS "exists"
  `;

  return rows[0]?.exists === true;
}
