export type BusinessSettingsRecord = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  id: string;
  logoUrl: string | null;
  name: string;
};

export type UpdateBusinessSettingsInput = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  logoUrl: string | null;
  name: string;
};

export interface BusinessSettingsRepository {
  findById(businessId: string): Promise<BusinessSettingsRecord | null>;
  updateById(
    businessId: string,
    input: UpdateBusinessSettingsInput,
  ): Promise<BusinessSettingsRecord | null>;
}
