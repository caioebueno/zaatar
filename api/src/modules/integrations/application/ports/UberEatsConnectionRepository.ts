export type ExternalIntegrationEnvironment = "SANDBOX" | "PRODUCTION";

export type SaveUberEatsConnectionInput = {
  accessToken: string;
  businessId: string | null;
  environment: ExternalIntegrationEnvironment;
  expiresAt: Date | null;
  rawPayload: unknown;
  refreshToken: string | null;
  scope: string | null;
  tokenType: string | null;
  userId: string;
};

export type UberEatsConnectionView = {
  accessToken?: string;
  businessId?: string | null;
  connectedAt: Date;
  connectionId?: string;
  environment: ExternalIntegrationEnvironment;
  expiresAt: Date | null;
  id: string;
  rawPayload?: unknown;
  refreshToken?: string | null;
  scope: string | null;
  tokenType?: string | null;
  updatedAt: Date;
};

export interface UberEatsConnectionRepository {
  findForUserWithSecrets(userId: string): Promise<UberEatsConnectionView | null>;
  findForUser(userId: string): Promise<UberEatsConnectionView | null>;
  save(input: SaveUberEatsConnectionInput): Promise<UberEatsConnectionView>;
}
