export type SquareConnectionEnvironment = "SANDBOX" | "PRODUCTION";

export type SquareConnectionView = {
  accessToken?: string;
  businessId: string;
  connectedAt: Date;
  environment: SquareConnectionEnvironment;
  expiresAt: Date | null;
  id: string;
  merchantId: string | null;
  rawPayload?: unknown;
  refreshToken?: string | null;
  scope: string | null;
  tokenType?: string | null;
  updatedAt: Date;
  userId: string;
};

export type SaveSquareConnectionInput = {
  accessToken: string;
  businessId: string;
  environment: SquareConnectionEnvironment;
  expiresAt: Date | null;
  merchantId: string | null;
  rawPayload: unknown;
  refreshToken: string | null;
  scope: string | null;
  tokenType: string | null;
  userId: string;
};

export interface SquareConnectionRepository {
  deleteByBusinessId(businessId: string): Promise<boolean>;
  findByBusinessId(businessId: string): Promise<SquareConnectionView | null>;
  findByBusinessIdWithSecrets(businessId: string): Promise<SquareConnectionView | null>;
  findByMerchantIdWithSecrets(merchantId: string): Promise<SquareConnectionView | null>;
  save(input: SaveSquareConnectionInput): Promise<SquareConnectionView>;
}
