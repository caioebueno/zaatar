export type CreateOwnerInput = {
  email: string;
  id: string;
  name: string;
  passwordHash: string;
};

export type OwnerRecord = {
  createdAt: Date;
  email: string;
  id: string;
  name: string;
};

export type OwnerAuthRecord = {
  email: string;
  id: string;
  name: string;
  passwordHash: string;
};

export type OwnedBusinessRecord = {
  businessId: string;
  name: string;
};

export interface OwnerRepository {
  create(input: CreateOwnerInput): Promise<OwnerRecord>;
  findByEmailForAuth(email: string): Promise<OwnerAuthRecord | null>;
  findOwnedBusinesses(userId: string): Promise<OwnedBusinessRecord[]>;
}
