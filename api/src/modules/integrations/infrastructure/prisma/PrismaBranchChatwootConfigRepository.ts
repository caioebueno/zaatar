import prisma from "../../../../prisma.js";
import type {
  BranchChatwootConfig,
  BranchChatwootConfigRepository,
} from "../../application/ports/BranchChatwootConfigRepository.js";

type BranchChatwootColumnsAvailability = {
  hasChatwootAccountId: boolean;
  hasChatwootAgentId: boolean;
  hasChatwootSourceId: boolean;
};

export class PrismaBranchChatwootConfigRepository
  implements BranchChatwootConfigRepository
{
  async findByIdAndBusinessId(
    branchId: string,
    businessId: string,
  ): Promise<BranchChatwootConfig | null> {
    const availability = await getBranchChatwootColumnsAvailability();
    const selectChatwootAccount = availability.hasChatwootAccountId
      ? `"chatwootAccountId"`
      : "NULL::text";
    const selectChatwootAgent = availability.hasChatwootAgentId
      ? `"chatwootAgentId"`
      : "NULL::text";
    const selectChatwootSource = availability.hasChatwootSourceId
      ? `"chatwootSourceId"`
      : "NULL::text";

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        chatwootAccountId: string | null;
        chatwootAgentId: string | null;
        chatwootSourceId: string | null;
      }>
    >(
      `
      SELECT
        "id",
        ${selectChatwootAccount} AS "chatwootAccountId",
        ${selectChatwootAgent} AS "chatwootAgentId",
        ${selectChatwootSource} AS "chatwootSourceId"
      FROM "Branch"
      WHERE "id" = $1
        AND "businessId" = $2
      LIMIT 1
    `,
      branchId,
      businessId,
    );

    return rows[0] ?? null;
  }
}

async function getBranchChatwootColumnsAvailability(): Promise<BranchChatwootColumnsAvailability> {
  const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'Branch'
      AND c.column_name IN ('chatwootAccountId', 'chatwootSourceId', 'chatwootAgentId')
  `;

  const set = new Set(columns.map((item) => item.column_name));
  return {
    hasChatwootAccountId: set.has("chatwootAccountId"),
    hasChatwootAgentId: set.has("chatwootAgentId"),
    hasChatwootSourceId: set.has("chatwootSourceId"),
  };
}
