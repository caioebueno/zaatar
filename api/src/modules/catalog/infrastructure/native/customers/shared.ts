import type { Prisma } from "../../../../../../../web/src/generated/prisma/index.js";

export type CustomerWithAddresses = {
  id: string;
  createdAt: Date;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  addresses: {
    id: string;
    createdAt: Date;
    description: string;
    street: string;
    number: string;
    city: string;
    State: string;
    zipCode: string;
    lat: string;
    lng: string;
    complement: string | null;
    numberComplement: string | null;
    customerId: string | null;
    deliveryFee: number;
  }[];
};

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizePhoneWithCountryCode(value: string): string {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "";
  if (digits.length < 10) return "";
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

export function buildPhoneCandidates(rawPhone: string): string[] {
  const normalized = normalizePhoneDigits(rawPhone);
  if (!normalized) return [];
  return [normalized];
}

export function parseOptionalNullableString(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function mapCustomer(customer: CustomerWithAddresses): {
  address: string | null;
  addresses: Array<{
    city: string;
    complement: string | null;
    createdAt: string;
    customerId: string | null;
    deliveryFee: number;
    description: string;
    id: string;
    lat: string;
    lng: string;
    number: string;
    numberComplement: string | null;
    state: string;
    street: string;
    zipCode: string;
  }>;
  createdAt: string;
  email: string | null;
  id: string;
  name: string | null;
  phone: string | null;
} {
  return {
    id: customer.id,
    createdAt: customer.createdAt.toISOString(),
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    addresses: customer.addresses.map((address) => ({
      id: address.id,
      createdAt: address.createdAt.toISOString(),
      description: address.description,
      street: address.street,
      number: address.number,
      city: address.city,
      state: address.State,
      zipCode: address.zipCode,
      lat: address.lat,
      lng: address.lng,
      complement: address.complement,
      numberComplement: address.numberComplement,
      customerId: address.customerId,
      deliveryFee: address.deliveryFee,
    })),
  };
}

export const customerInclude = {
  addresses: {
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.CustomerInclude;
