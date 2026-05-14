import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import type {
  BusinessRecord,
  BusinessRepository,
  CreateOwnedBusinessInput,
} from "../../application/ports/BusinessRepository.js";

export class PrismaBusinessRepository implements BusinessRepository {
  async createOwnedBusiness(input: CreateOwnedBusinessInput): Promise<BusinessRecord> {
    return prisma.$transaction(async (tx) => {
      const businessId = input.id || randomUUID();
      const now = new Date();

      const columns = await tx.$queryRaw<
        Array<{ column_name: string; is_nullable: "YES" | "NO"; column_default: string | null }>
      >`
        SELECT
          c.column_name,
          c.is_nullable,
          c.column_default
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'Business'
      `;

      const availableColumns = new Set(columns.map((column) => column.column_name));

      const valuesByColumn: Record<string, unknown> = {
        id: businessId,
        name: input.name,
        createdAt: now,
        updatedAt: now,
        logoUrl: input.logoUrl,
        bannerPhotoUrl: null,
        brandColor: "#0f766e",
        stripeAccountId: input.stripeAccountId,
        stripeDetailsSubmitted: input.stripeDetailsSubmitted,
        stripeChargesEnabled: input.stripeChargesEnabled,
        stripePayoutsEnabled: input.stripePayoutsEnabled,
        stripeOnboardingCompletedAt: input.stripeOnboardingCompletedAt,
      };

      const insertColumns: string[] = [];
      const insertValues: unknown[] = [];

      for (const [columnName, value] of Object.entries(valuesByColumn)) {
        if (!availableColumns.has(columnName)) continue;
        insertColumns.push(columnName);
        insertValues.push(value);
      }

      if (insertColumns.length === 0) {
        throw new Error("Business table columns not found");
      }

      const quotedColumns = insertColumns.map((columnName) => `"${columnName}"`).join(", ");
      const placeholders = insertColumns.map((_, index) => `$${index + 1}`).join(", ");

      await tx.$executeRawUnsafe(
        `INSERT INTO "Business" (${quotedColumns}) VALUES (${placeholders})`,
        ...insertValues,
      );

      await tx.businessOwner.create({
        data: {
          businessId,
          userId: input.userId,
        },
      });

      const createdRows = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          logoUrl: string | null;
          bannerPhotoUrl: string | null;
          brandColor: string | null;
        }>
      >`
        SELECT
          b."id",
          b."name",
          ${availableColumns.has("logoUrl") ? 'b."logoUrl"' : "NULL::text"} AS "logoUrl",
          ${
            availableColumns.has("bannerPhotoUrl")
              ? 'b."bannerPhotoUrl"'
              : "NULL::text"
          } AS "bannerPhotoUrl",
          ${
            availableColumns.has("brandColor")
              ? 'b."brandColor"'
              : "NULL::text"
          } AS "brandColor"
        FROM "Business" b
        WHERE b."id" = ${businessId}
        LIMIT 1
      `;

      const created = createdRows[0];
      if (!created) {
        throw new Error("Failed to create business");
      }

      return {
        id: created.id,
        name: created.name,
        logoUrl: created.logoUrl,
        bannerPhotoUrl: created.bannerPhotoUrl,
        brandColor: created.brandColor ?? "#0f766e",
      };
    });
  }
}
