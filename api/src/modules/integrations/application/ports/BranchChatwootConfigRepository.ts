export type BranchChatwootConfig = {
  chatwootAccountId: string | null;
  chatwootAgentId: string | null;
  chatwootSourceId: string | null;
  id: string;
};

export interface BranchChatwootConfigRepository {
  findByIdAndBusinessId(
    branchId: string,
    businessId: string,
  ): Promise<BranchChatwootConfig | null>;
}
