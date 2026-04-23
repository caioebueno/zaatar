import prisma from "@/prisma";
import { buildPhoneCandidates, normalizePhoneWithCountryCode } from "@/src/phone";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
};

type CustomerWithAddresses = {
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

function parseRequiredPhone(value: unknown): string {
  if (typeof value !== "string") {
    throw { code: "INVALID_PARAMS", details: { field: "phone" } };
  }

  const normalized = normalizePhoneWithCountryCode(value);
  if (!normalized) {
    throw { code: "INVALID_PARAMS", details: { field: "phone" } };
  }

  return normalized;
}

function parseOptionalNullableString(
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

function mapCustomer(customer: CustomerWithAddresses) {
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;
    const phone = parseRequiredPhone(body.phone);
    const name = parseOptionalNullableString(body.name, "name");
    const email = parseOptionalNullableString(body.email, "email");
    const address = parseOptionalNullableString(body.address, "address");
    const phoneCandidates = buildPhoneCandidates(phone);

    const existingCustomer = (await prisma.customer.findFirst({
      where: {
        phone: {
          in: phoneCandidates,
        },
      },
      include: {
        addresses: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })) as CustomerWithAddresses | null;

    if (existingCustomer) {
      const updateData: {
        phone?: string;
        name?: string | null;
        email?: string | null;
        address?: string | null;
      } = {};

      if (existingCustomer.phone !== phone) {
        updateData.phone = phone;
      }
      if (name !== undefined) {
        updateData.name = name;
      }
      if (email !== undefined) {
        updateData.email = email;
      }
      if (address !== undefined) {
        updateData.address = address;
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(mapCustomer(existingCustomer));
      }

      const updatedCustomer = (await prisma.customer.update({
        where: {
          id: existingCustomer.id,
        },
        data: updateData,
        include: {
          addresses: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      })) as CustomerWithAddresses;

      return NextResponse.json(mapCustomer(updatedCustomer));
    }

    const createdCustomer = (await prisma.customer.create({
      data: {
        id: randomUUID(),
        phone,
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(address !== undefined ? { address } : {}),
      },
      include: {
        addresses: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })) as CustomerWithAddresses;

    return NextResponse.json(mapCustomer(createdCustomer), { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "INVALID_PARAMS"
    ) {
      const field =
        "details" in error &&
        typeof (error as { details?: { field?: string } }).details?.field ===
          "string"
          ? (error as { details?: { field?: string } }).details?.field
          : undefined;

      return NextResponse.json(
        {
          error: "Invalid payload",
          ...(field ? { field } : {}),
        },
        { status: 400 },
      );
    }

    console.error("POST /api/customers error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
