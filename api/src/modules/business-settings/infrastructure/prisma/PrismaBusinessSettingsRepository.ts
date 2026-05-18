import prisma from "../../../../prisma.js";
import type {
  BusinessSettingsRecord,
  BusinessSettingsRepository,
  UpdateBusinessSettingsInput,
} from "../../application/ports/BusinessSettingsRepository.js";

export class PrismaBusinessSettingsRepository
  implements BusinessSettingsRepository
{
  async findById(businessId: string): Promise<BusinessSettingsRecord | null> {
    const rows = await prisma.$queryRaw<BusinessSettingsRecord[]>`
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

    return rows[0] ?? null;
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

    return rows[0] ?? null;
  }
}
