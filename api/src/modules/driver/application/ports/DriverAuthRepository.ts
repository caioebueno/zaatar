import type { DriverOtpChannel } from "./DriverOtpSender.js";

export type DriverAuthEntity = {
  active: boolean;
  activatedAt: Date | null;
  deactivatedAt: Date | null;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
};

export type DriverOtpChallengeEntity = {
  attemptCount: number;
  codeHash: string;
  createdAt: Date;
  expiresAt: Date;
  id: string;
  maxAttempts: number;
  phone: string;
  usedAt: Date | null;
};

export type CreateDriverOtpChallengeInput = {
  channel: DriverOtpChannel;
  codeHash: string;
  expiresAt: Date;
  phone: string;
};

export type DriverAuthRepository = {
  createOtpChallenge(input: CreateDriverOtpChallengeInput): Promise<void>;
  findActiveDriverByPhone(phoneCandidates: string[]): Promise<DriverAuthEntity | null>;
  findLatestValidOtpChallenge(phone: string): Promise<DriverOtpChallengeEntity | null>;
  markOtpChallengeAttempt(input: {
    challengeId: string;
    markUsed: boolean;
    nextAttemptCount: number;
  }): Promise<void>;
  updateDriverPhone(driverId: string, phone: string): Promise<void>;
};
