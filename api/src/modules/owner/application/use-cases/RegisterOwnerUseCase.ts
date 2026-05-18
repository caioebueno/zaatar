import { InvalidPayloadError } from "../errors/InvalidPayloadError.js";
import type { IdGenerator } from "../ports/IdGenerator.js";
import type { OwnerRecord, OwnerRepository } from "../ports/OwnerRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";

export type RegisterOwnerInput = {
  email: unknown;
  name: unknown;
  password: unknown;
  phone: unknown;
};

export type RegisterOwnerOutput = {
  owner: OwnerRecord;
};

export class RegisterOwnerUseCase {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: RegisterOwnerInput): Promise<RegisterOwnerOutput> {
    const name = normalizeRequiredString(input.name, "name");
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const password = normalizePassword(input.password);

    const passwordHash = await this.passwordHasher.hash(password);

    const owner = await this.ownerRepository.create({
      id: this.idGenerator.generate(),
      name,
      email,
      phone,
      passwordHash,
    });

    return { owner };
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
  const password = normalizeRequiredString(value, "password");
  if (password.length < 8) {
    throw new InvalidPayloadError("password");
  }

  return password;
}

function normalizePhone(value: unknown): string {
  const rawPhone = normalizeRequiredString(value, "phone");
  const normalized = rawPhone.replace(/\D/g, "");
  if (normalized.length < 10 || normalized.length > 20) {
    throw new InvalidPayloadError("phone");
  }
  return normalized;
}
