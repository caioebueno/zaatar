import { BusinessContextRequiredError } from "../../../onboarding/application/errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../../../onboarding/application/errors/BusinessNotFoundError.js";
import { InvalidOnboardingPayloadError } from "../../../onboarding/application/errors/InvalidOnboardingPayloadError.js";
import type {
  BranchOnboardingRecord,
  BusinessOnboardingRepository,
  UpsertBranchOnboardingInput,
} from "../../../onboarding/application/ports/BusinessOnboardingRepository.js";

export type CreateBranchInput = {
  addressDescription?: unknown;
  addressGoogleMapsUrl?: unknown;
  addressStreet?: unknown;
  addressNumber?: unknown;
  addressCity?: unknown;
  addressState?: unknown;
  addressZipCode?: unknown;
  addressComplement?: unknown;
  addressNumberComplement?: unknown;
  mapboxLatitude?: unknown;
  mapboxLongitude?: unknown;
  mapboxPlaceId?: unknown;
  businessId?: string | null;
  name?: unknown;
  operationHours?: unknown;
};

export type CreateBranchOutput = {
  addressCity: string | null;
  addressComplement: string | null;
  addressDescription: string;
  addressGoogleMapsUrl: string;
  addressLatitude: number | null;
  addressLongitude: number | null;
  addressNumber: string | null;
  addressNumberComplement: string | null;
  addressPlaceId: string | null;
  addressState: string | null;
  addressStreet: string | null;
  addressZipCode: string | null;
  createdAt: string;
  id: string;
  name: string;
  operationHours: unknown;
};

export class CreateBranchUseCase {
  constructor(private readonly repository: BusinessOnboardingRepository) {}

  async execute(input: CreateBranchInput): Promise<CreateBranchOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new BusinessNotFoundError();
    }

    const parsedBranchInput = parseBranchInput({
      name: input.name,
      addressDescription: input.addressDescription,
      addressGoogleMapsUrl: input.addressGoogleMapsUrl,
      mapboxPlaceId: input.mapboxPlaceId,
      mapboxLatitude: input.mapboxLatitude,
      mapboxLongitude: input.mapboxLongitude,
      addressStreet: input.addressStreet,
      addressNumber: input.addressNumber,
      addressCity: input.addressCity,
      addressState: input.addressState,
      addressZipCode: input.addressZipCode,
      addressComplement: input.addressComplement,
      addressNumberComplement: input.addressNumberComplement,
      operationHours: input.operationHours,
    });

    const branch = await this.repository.createBranch(businessId, parsedBranchInput);
    return mapBranch(branch, parsedBranchInput.addressPlaceId ?? null);
  }
}

function parseBranchInput(input: {
  addressDescription?: unknown;
  addressGoogleMapsUrl?: unknown;
  mapboxLatitude?: unknown;
  mapboxLongitude?: unknown;
  mapboxPlaceId?: unknown;
  addressStreet?: unknown;
  addressNumber?: unknown;
  addressCity?: unknown;
  addressState?: unknown;
  addressZipCode?: unknown;
  addressComplement?: unknown;
  addressNumberComplement?: unknown;
  name?: unknown;
  operationHours?: unknown;
}): UpsertBranchOnboardingInput {
  const name = parseRequiredText(input.name, "name", 120);
  const addressDescription = parseRequiredText(
    input.addressDescription,
    "addressDescription",
    240,
  );
  const addressPlaceId = parseRequiredText(input.mapboxPlaceId, "mapboxPlaceId", 255);
  const latitude = parseCoordinate(input.mapboxLatitude, "mapboxLatitude", -90, 90);
  const longitude = parseCoordinate(input.mapboxLongitude, "mapboxLongitude", -180, 180);
  const addressGoogleMapsUrl = buildGoogleMapsUrl(latitude, longitude);
  const addressStreet = parseOptionalText(input.addressStreet, "addressStreet", 180);
  const addressNumber = parseOptionalText(input.addressNumber, "addressNumber", 50);
  const addressCity = parseOptionalText(input.addressCity, "addressCity", 120);
  const addressState = parseOptionalText(input.addressState, "addressState", 120);
  const addressZipCode = parseOptionalText(input.addressZipCode, "addressZipCode", 32);
  const addressComplement = parseOptionalText(input.addressComplement, "addressComplement", 180);
  const addressNumberComplement = parseOptionalText(
    input.addressNumberComplement,
    "addressNumberComplement",
    32,
  );
  const operationHours = parseOperationHours(input.operationHours);

  return {
    name,
    addressDescription,
    addressGoogleMapsUrl,
    addressPlaceId,
    addressLatitude: latitude,
    addressLongitude: longitude,
    addressStreet,
    addressNumber,
    addressCity,
    addressState,
    addressZipCode,
    addressComplement,
    addressNumberComplement,
    operationHours,
  };
}

function parseRequiredText(value: unknown, field: string, maxLen: number): string {
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError(field);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLen) {
    throw new InvalidOnboardingPayloadError(field);
  }
  return normalized;
}

function parseOptionalText(value: unknown, field: string, maxLen: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError(field);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLen) {
    throw new InvalidOnboardingPayloadError(field);
  }
  return normalized;
}

function parseOperationHours(value: unknown): unknown {
  if (value === undefined || value === null) {
    throw new InvalidOnboardingPayloadError("operationHours");
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidOnboardingPayloadError("operationHours");
  }
  return value;
}

function parseCoordinate(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new InvalidOnboardingPayloadError(field);
  }
  if (value < min || value > max) {
    throw new InvalidOnboardingPayloadError(field);
  }
  return value;
}

function buildGoogleMapsUrl(latitude: number, longitude: number): string {
  const query = `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function mapBranch(
  branch: BranchOnboardingRecord,
  addressPlaceId: string | null,
): CreateBranchOutput {
  const latitude =
    branch.address?.lat !== null && branch.address?.lat !== undefined
      ? Number(branch.address.lat)
      : null;
  const longitude =
    branch.address?.lng !== null && branch.address?.lng !== undefined
      ? Number(branch.address.lng)
      : null;

  return {
    id: branch.id,
    name: branch.name,
    createdAt: branch.createdAt.toISOString(),
    operationHours: branch.operationHours,
    addressDescription: branch.address?.description ?? "",
    addressGoogleMapsUrl: branch.address?.googleMapsUrl ?? "",
    addressPlaceId: branch.address?.placeId ?? addressPlaceId,
    addressLatitude: Number.isFinite(latitude) ? latitude : null,
    addressLongitude: Number.isFinite(longitude) ? longitude : null,
    addressStreet: branch.address?.street ?? null,
    addressNumber: branch.address?.number ?? null,
    addressCity: branch.address?.city ?? null,
    addressState: branch.address?.state ?? null,
    addressZipCode: branch.address?.zipCode ?? null,
    addressComplement: branch.address?.complement ?? null,
    addressNumberComplement: branch.address?.numberComplement ?? null,
  };
}
