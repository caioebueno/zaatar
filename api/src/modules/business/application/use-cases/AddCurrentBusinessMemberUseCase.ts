import { randomUUID } from "node:crypto";
import { BusinessAccessDeniedError } from "../errors/BusinessAccessDeniedError.js";
import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { InvalidBusinessPayloadError } from "../errors/InvalidBusinessPayloadError.js";
import type { BusinessRepository } from "../ports/BusinessRepository.js";
import type { OwnerRepository } from "../../../owner/application/ports/OwnerRepository.js";
import type { PasswordHasher } from "../../../owner/application/ports/PasswordHasher.js";
import { buildPhoneCandidates, normalizePhone } from "../../../owner/application/use-cases/ownerAuthShared.js";

const ASSIGNABLE_MEMBER_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;
type AssignableMemberRole = (typeof ASSIGNABLE_MEMBER_ROLES)[number];

export type AddCurrentBusinessMemberInput = {
  actorRole?: string | null;
  businessId?: string | null;
  email?: unknown;
  name?: unknown;
  phone: unknown;
  role?: unknown;
  userId: string;
};

export type AddCurrentBusinessMemberOutput = {
  createdUser: boolean;
  member: {
    createdAt: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    status: string;
    userId: string;
  };
};

export class AddCurrentBusinessMemberUseCase {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly ownerRepository: OwnerRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    input: AddCurrentBusinessMemberInput,
  ): Promise<AddCurrentBusinessMemberOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const actorRole = normalizeActorRole(input.actorRole);
    const requestedRole = normalizeRequestedRole(input.role, actorRole);
    const phone = normalizePhone(input.phone, "phone");
    const phoneCandidates = buildPhoneCandidates(phone);

    let memberUser = await this.ownerRepository.findByPhone(phoneCandidates);
    let createdUser = false;

    if (!memberUser) {
      const name = normalizeName(input.name);
      const email = normalizeOptionalEmail(input.email) ?? buildGeneratedEmail(phone);
      const existingEmailOwner = await this.ownerRepository.findByEmailForAuth(email);
      if (existingEmailOwner) {
        throw new InvalidBusinessPayloadError("email");
      }

      const passwordHash = await this.passwordHasher.hash(
        `Zippy${randomUUID()}${randomUUID()}`,
      );
      const createdOwner = await this.ownerRepository.create({
        email,
        id: randomUUID(),
        name,
        passwordHash,
        phone,
      });
      memberUser = {
        email: createdOwner.email,
        id: createdOwner.id,
        name: createdOwner.name,
        phone: createdOwner.phone,
      };
      createdUser = true;
    }

    const membership = await this.businessRepository.addBusinessMember({
      businessId,
      invitedByUserId: input.userId,
      role: requestedRole,
      userId: memberUser.id,
    });

    return {
      createdUser,
      member: {
        createdAt: membership.createdAt.toISOString(),
        email: membership.email,
        name: membership.name,
        phone: membership.phone,
        role: membership.role,
        status: membership.status,
        userId: membership.userId,
      },
    };
  }
}

function normalizeActorRole(value: unknown): AssignableMemberRole {
  if (
    typeof value !== "string" ||
    !ASSIGNABLE_MEMBER_ROLES.includes(value as AssignableMemberRole)
  ) {
    throw new BusinessAccessDeniedError();
  }

  return value as AssignableMemberRole;
}

function normalizeRequestedRole(
  value: unknown,
  actorRole: AssignableMemberRole,
): AssignableMemberRole {
  if (value === undefined || value === null) {
    return "MANAGER";
  }

  if (
    typeof value !== "string" ||
    !ASSIGNABLE_MEMBER_ROLES.includes(value as AssignableMemberRole)
  ) {
    throw new InvalidBusinessPayloadError("role");
  }

  const normalized = value as AssignableMemberRole;
  if (actorRole === "MANAGER" && normalized !== "MANAGER") {
    throw new BusinessAccessDeniedError();
  }

  if (normalized === "ADMIN" && actorRole === "MANAGER") {
    throw new BusinessAccessDeniedError();
  }

  if (normalized === "OWNER" && actorRole !== "OWNER") {
    throw new BusinessAccessDeniedError();
  }

  return normalized;
}

function normalizeName(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidBusinessPayloadError("name");
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > 120) {
    throw new InvalidBusinessPayloadError("name");
  }

  return normalized;
}

function normalizeOptionalEmail(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new InvalidBusinessPayloadError("email");
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new InvalidBusinessPayloadError("email");
  }

  return normalized;
}

function buildGeneratedEmail(phone: string): string {
  return `${phone}@auth.zippy.app`;
}
