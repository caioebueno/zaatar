import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import { BranchNotFoundError } from "../errors/BranchNotFoundError.js";
import { InvalidOnboardingPayloadError } from "../errors/InvalidOnboardingPayloadError.js";
import type {
  BranchOnboardingRecord,
  BusinessOnboardingRepository,
  UpsertBranchOnboardingInput,
} from "../ports/BusinessOnboardingRepository.js";

export type UpdateOnboardingBranchInput = {
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
  branchId: string;
  businessId?: string | null;
  name?: unknown;
  operationHours?: unknown;
};

export type UpdateOnboardingBranchOutput = {
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

export class UpdateOnboardingBranchUseCase {
  constructor(private readonly repository: BusinessOnboardingRepository) {}

  async execute(input: UpdateOnboardingBranchInput): Promise<UpdateOnboardingBranchOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new BusinessNotFoundError();
    }

    const branchId = input.branchId.trim();
    if (!branchId) {
      throw new InvalidOnboardingPayloadError("branchId");
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

    const branch = await this.repository.updateBranch(
      businessId,
      branchId,
      parsedBranchInput,
    );

    if (!branch) {
      throw new BranchNotFoundError();
    }

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
  const addressPlaceId = parseOptionalText(input.mapboxPlaceId, "mapboxPlaceId", 255);
  const latitude = parseOptionalCoordinate(input.mapboxLatitude, "mapboxLatitude", -90, 90);
  const longitude = parseOptionalCoordinate(input.mapboxLongitude, "mapboxLongitude", -180, 180);
  const addressGoogleMapsUrl = resolveGoogleMapsUrl({
    addressGoogleMapsUrl: input.addressGoogleMapsUrl,
    latitude,
    longitude,
  });
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

function parseRequiredUrl(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError(field);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidOnboardingPayloadError(field);
  }
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new InvalidOnboardingPayloadError(field);
    }
    return normalized;
  } catch {
    throw new InvalidOnboardingPayloadError(field);
  }
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

function parseOptionalCoordinate(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | null {
  if (value === undefined || value === null) return null;
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

function resolveGoogleMapsUrl(input: {
  addressGoogleMapsUrl?: unknown;
  latitude: number | null;
  longitude: number | null;
}): string {
  if (input.latitude !== null && input.longitude !== null) {
    return buildGoogleMapsUrl(input.latitude, input.longitude);
  }
  return parseRequiredUrl(input.addressGoogleMapsUrl, "addressGoogleMapsUrl");
}

function mapBranch(
  branch: BranchOnboardingRecord,
  addressPlaceId: string | null,
): UpdateOnboardingBranchOutput {
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
