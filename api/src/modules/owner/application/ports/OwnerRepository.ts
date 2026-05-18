export type CreateOwnerInput = {
  email: string;
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
};

export type OwnerRecord = {
  createdAt: Date;
  email: string;
  id: string;
  name: string;
  phone: string;
};

export type OwnerAuthRecord = {
  email: string;
  id: string;
  name: string;
  phone: string | null;
  passwordHash: string;
};

export type OwnedBusinessRecord = {
  businessId: string;
  name: string;
};

export type OwnerOtpChallengeRecord = {
  attemptCount: number;
  codeHash: string;
  createdAt: Date;
  phone: string;
  expiresAt: Date;
  id: string;
  maxAttempts: number;
  ownerId: string;
  usedAt: Date | null;
};

export interface OwnerRepository {
  createOtpChallenge(input: {
    codeHash: string;
    phone: string;
    expiresAt: Date;
    ownerId: string;
  }): Promise<void>;
  create(input: CreateOwnerInput): Promise<OwnerRecord>;
  findByPhoneForAuth(phoneCandidates: string[]): Promise<OwnerAuthRecord | null>;
  findLatestValidOtpChallenge(phone: string): Promise<OwnerOtpChallengeRecord | null>;
  findByEmailForAuth(email: string): Promise<OwnerAuthRecord | null>;
  findOwnedBusinesses(userId: string): Promise<OwnedBusinessRecord[]>;
  markOtpChallengeAttempt(input: {
    challengeId: string;
    markUsed: boolean;
    nextAttemptCount: number;
  }): Promise<void>;
}
