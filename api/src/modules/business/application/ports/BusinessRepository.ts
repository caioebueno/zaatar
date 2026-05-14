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

export interface BusinessRepository {
  createOwnedBusiness(input: CreateOwnedBusinessInput): Promise<BusinessRecord>;
}
