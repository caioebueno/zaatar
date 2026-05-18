import { randomUUID } from "node:crypto";
import prisma from "../../../../../prisma.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";
import {
  buildPhoneCandidates,
  customerInclude,
  CustomerWithAddresses,
  mapCustomer,
  normalizePhoneWithCountryCode,
  parseOptionalNullableString,
} from "./shared.js";

type PostBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
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

export async function POST(request: NextRequestLike) {
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
      include: customerInclude,
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
        include: customerInclude,
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
      include: customerInclude,
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

    console.error("POST /customers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
