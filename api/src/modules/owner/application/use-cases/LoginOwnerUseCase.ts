import { InvalidCredentialsError } from "../errors/InvalidCredentialsError.js";
import { InvalidPayloadError } from "../errors/InvalidPayloadError.js";
import type { AccessTokenSigner, SignedAccessToken } from "../ports/AccessTokenSigner.js";
import type { OwnerRepository } from "../ports/OwnerRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";

export type LoginOwnerInput = {
  email: unknown;
  password: unknown;
};

export type LoginOwnerOutput = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
  selectedBusinessId: string | null;
  token: SignedAccessToken;
  user: {
    email: string;
    id: string;
    name: string;
    phone: string | null;
  };
};

export class LoginOwnerUseCase {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenSigner: AccessTokenSigner,
  ) {}

  async execute(input: LoginOwnerInput): Promise<LoginOwnerOutput> {
    const email = normalizeEmail(input.email);
    const password = normalizePassword(input.password);

    const owner = await this.ownerRepository.findByEmailForAuth(email);
    if (!owner) {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await this.passwordHasher.verify(
      password,
      owner.passwordHash,
    );

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const token = this.accessTokenSigner.sign({
      userId: owner.id,
      email: owner.email,
      name: owner.name,
    });

    const businesses = await this.ownerRepository.findOwnedBusinesses(owner.id);

    const selectedBusinessId = businesses[0]?.businessId ?? null;

    return {
      token,
      user: {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        phone: owner.phone,
      },
      selectedBusinessId,
      businesses: businesses.map((business) => ({
        id: business.businessId,
        name: business.name,
      })),
    };
  }
}

function normalizeRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidPayloadError(field);
  }

  return normalized;
}

function normalizeEmail(value: unknown): string {
  const email = normalizeRequiredString(value, "email").toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new InvalidPayloadError("email");
  }

  return email;
}

function normalizePassword(value: unknown): string {
  return normalizeRequiredString(value, "password");
}
