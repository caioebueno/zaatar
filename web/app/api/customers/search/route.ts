import prisma from "@/prisma";
import { buildPhoneCandidates, normalizePhoneDigits } from "@/src/phone";
import { NextRequest, NextResponse } from "next/server";

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

function getMatchScore(
  phone: string | null,
  phoneCandidates: string[],
): number {
  const normalizedPhone = normalizePhoneDigits(phone || "");
  if (!normalizedPhone) return Number.MAX_SAFE_INTEGER;

  for (const candidate of phoneCandidates) {
    if (normalizedPhone === candidate) return 0;
  }

  for (const candidate of phoneCandidates) {
    if (normalizedPhone.endsWith(candidate)) return 1;
  }

  for (const candidate of phoneCandidates) {
    if (normalizedPhone.includes(candidate)) return 2;
  }

  return Number.MAX_SAFE_INTEGER;
}

export async function GET(request: NextRequest) {
  try {
    const rawPhone = request.nextUrl.searchParams.get("phone")?.trim() || "";
    const phoneCandidates = buildPhoneCandidates(rawPhone);

    if (phoneCandidates.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload", field: "phone" },
        { status: 400 },
      );
    }

    const customers = (await prisma.customer.findMany({
      where: {
        phone: { not: null },
        OR: phoneCandidates.map((candidate) => ({
          phone: {
            contains: candidate,
          },
        })),
      },
      include: {
        addresses: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      take: 50,
    })) as CustomerWithAddresses[];

    const rankedCustomers = customers
      .map((customer) => ({
        customer,
        score: getMatchScore(customer.phone, phoneCandidates),
      }))
      .filter((item) => item.score !== Number.MAX_SAFE_INTEGER)
      .sort((left, right) => {
        if (left.score !== right.score) return left.score - right.score;
        return right.customer.createdAt.getTime() - left.customer.createdAt.getTime();
      })
      .slice(0, 5)
      .map((item) => mapCustomer(item.customer));

    return NextResponse.json(rankedCustomers);
  } catch (error) {
    console.error("GET /api/customers/search error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
