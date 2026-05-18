export type BusinessOnboardingRecord = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  id: string;
  logoUrl: string | null;
  name: string;
  onboardingCompletedAt: Date | null;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  stripeOnboardingCompletedAt: Date | null;
  stripePayoutsEnabled: boolean;
};

export type UpdateBusinessOnboardingInput = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  logoUrl: string | null;
  name: string;
};

export type UpdateStripeStateInput = {
  onboardingCompletedAt: Date | null;
  stripeAccountId: string;
  stripeChargesEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  stripeOnboardingCompletedAt: Date | null;
  stripePayoutsEnabled: boolean;
};

export type BranchOnboardingRecord = {
  address: {
    city: string | null;
    complement: string | null;
    description: string;
    googleMapsUrl: string;
    id: string;
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

export type UpsertBranchOnboardingInput = {
  addressCity?: string | null;
  addressComplement?: string | null;
  addressDescription: string;
  addressGoogleMapsUrl: string;
  addressLatitude?: number | null;
  addressLongitude?: number | null;
  addressNumber?: string | null;
  addressNumberComplement?: string | null;
  addressPlaceId?: string | null;
  addressState?: string | null;
  addressStreet?: string | null;
  addressZipCode?: string | null;
  name: string;
  operationHours: unknown;
};

export interface BusinessOnboardingRepository {
  createBranch(
    businessId: string,
    input: UpsertBranchOnboardingInput,
  ): Promise<BranchOnboardingRecord>;
  findById(businessId: string): Promise<BusinessOnboardingRecord | null>;
  listBranchesByBusinessId(businessId: string): Promise<BranchOnboardingRecord[]>;
  removeBranch(businessId: string, branchId: string): Promise<boolean>;
  updateBasicInfo(
    businessId: string,
    input: UpdateBusinessOnboardingInput,
  ): Promise<BusinessOnboardingRecord | null>;
  updateBranch(
    businessId: string,
    branchId: string,
    input: UpsertBranchOnboardingInput,
  ): Promise<BranchOnboardingRecord | null>;
  updateStripeState(
    businessId: string,
    input: UpdateStripeStateInput,
  ): Promise<BusinessOnboardingRecord | null>;
}
