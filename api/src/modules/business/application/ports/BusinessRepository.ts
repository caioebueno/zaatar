export type CreateOwnedBusinessInput = {
  id: string;
  logoUrl: string;
  name: string;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  stripeOnboardingCompletedAt: Date | null;
  stripePayoutsEnabled: boolean;
  userId: string;
};

export type BusinessRecord = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  id: string;
  logoUrl: string | null;
  name: string;
};

export type OwnedBusinessRecord = {
  businessId: string;
  logoUrl: string | null;
  name: string;
};

export type BusinessBranchRecord = {
  address: {
    city: string | null;
    complement: string | null;
    description: string;
    googleMapsUrl: string;
    lat: string | null;
    lng: string | null;
    number: string | null;
    numberComplement: string | null;
    placeId: string | null;
    state: string | null;
    street: string | null;
    zipCode: string | null;
  } | null;
  createdAt: Date;
  id: string;
  name: string;
  operationHours: unknown;
};

export type CurrentBusinessRecord = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  branches: BusinessBranchRecord[];
  createdAt: Date;
  id: string;
  logoUrl: string | null;
  name: string;
};

export interface BusinessRepository {
  createOwnedBusiness(input: CreateOwnedBusinessInput): Promise<BusinessRecord>;
  findCurrentBusinessById(businessId: string): Promise<CurrentBusinessRecord | null>;
  findOwnedBusinesses(userId: string): Promise<OwnedBusinessRecord[]>;
}
