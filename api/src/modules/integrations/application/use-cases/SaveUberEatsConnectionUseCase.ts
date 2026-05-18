import type {
  ExternalIntegrationEnvironment,
  UberEatsConnectionRepository,
  UberEatsConnectionView,
} from "../ports/UberEatsConnectionRepository.js";

export type SaveUberEatsConnectionInput = {
  accessToken: string;
  environment: ExternalIntegrationEnvironment;
  expiresAt: Date | null;
  rawPayload: unknown;
  refreshToken: string | null;
  scope: string | null;
  tokenType: string | null;
  userId: string;
};

export class SaveUberEatsConnectionUseCase {
  constructor(private readonly repository: UberEatsConnectionRepository) {}

  async execute(input: SaveUberEatsConnectionInput): Promise<UberEatsConnectionView> {
    return this.repository.save({
      ...input,
      businessId: null,
    });
  }
}
