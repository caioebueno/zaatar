import { InvalidChatwootWebhookPayloadError } from "../errors/InvalidChatwootWebhookPayloadError.js";
import type { ChatwootWebhookRepository } from "../ports/ChatwootWebhookRepository.js";

type RegisterOwnerIosPushTokenUseCaseInput = {
  businessId?: string | null;
  body: unknown;
  userId: string;
};

type RegisterOwnerIosPushTokenUseCaseOutput = {
  ok: true;
};

export class RegisterOwnerIosPushTokenUseCase {
  constructor(private readonly repository: ChatwootWebhookRepository) {}

  async execute(
    input: RegisterOwnerIosPushTokenUseCaseInput,
  ): Promise<RegisterOwnerIosPushTokenUseCaseOutput> {
    if (!input.businessId) {
      throw new InvalidChatwootWebhookPayloadError("businessId");
    }

    const body = toObject(input.body);
    const pushToken = parseRequiredString(body.pushToken, "pushToken");

    await this.repository.registerOwnerIosPushToken({
      userId: input.userId,
      businessId: input.businessId,
      pushToken,
    });

    return { ok: true };
  }
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function parseRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidChatwootWebhookPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidChatwootWebhookPayloadError(field);
  }

  return normalized;
}
