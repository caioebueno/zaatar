import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import type {
  BusinessBranchRecord,
  BusinessRecord,
  BusinessRepository,
  CurrentBusinessRecord,
  CreateOwnedBusinessInput,
  OwnedBusinessRecord,
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

  async findOwnedBusinesses(userId: string): Promise<OwnedBusinessRecord[]> {
    const rows = await prisma.businessOwner.findMany({
      where: { userId },
      select: {
        businessId: true,
        business: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rows
      .map((row) => {
        if (!row.business) return null;
        return {
          businessId: row.business.id,
          name: row.business.name,
          logoUrl: row.business.logoUrl,
        } satisfies OwnedBusinessRecord;
      })
      .filter((row): row is OwnedBusinessRecord => row !== null);
  }

  async findCurrentBusinessById(
    businessId: string,
  ): Promise<CurrentBusinessRecord | null> {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        id: true,
        createdAt: true,
        name: true,
        logoUrl: true,
        bannerPhotoUrl: true,
        brandColor: true,
        branches: {
          select: {
            id: true,
            createdAt: true,
            name: true,
            operationHours: true,
            address: {
              select: {
                description: true,
                googleMapsUrl: true,
                placeId: true,
                lat: true,
                lng: true,
                street: true,
                number: true,
                city: true,
                State: true,
                zipCode: true,
                complement: true,
                numberComplement: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!business) {
      return null;
    }

    return {
      id: business.id,
      createdAt: business.createdAt,
      name: business.name,
      logoUrl: business.logoUrl,
      bannerPhotoUrl: business.bannerPhotoUrl,
      brandColor: business.brandColor,
      branches: business.branches.map((branch) => {
        const mapped: BusinessBranchRecord = {
          id: branch.id,
          createdAt: branch.createdAt,
          name: branch.name,
          operationHours: branch.operationHours,
          address: branch.address
            ? {
                description: branch.address.description,
                googleMapsUrl: branch.address.googleMapsUrl,
                placeId: branch.address.placeId,
                lat: branch.address.lat,
                lng: branch.address.lng,
                street: branch.address.street,
                number: branch.address.number,
                city: branch.address.city,
                state: branch.address.State,
                zipCode: branch.address.zipCode,
                complement: branch.address.complement,
                numberComplement: branch.address.numberComplement,
              }
            : null,
        };

        return mapped;
      }),
    };
  }
}
