import prisma from "../../../../../prisma.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";
import {
  buildPhoneCandidates,
  CustomerWithAddresses,
  normalizePhoneDigits,
} from "./shared.js";

function getMatchScore(phone: string | null, phoneCandidates: string[]): number {
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

type AddressResponse = {
  city: string;
  complement: string | null;
  createdAt: string;
  customerId: string | null;
  deliveryFee: number;
  expectedHandoffDuration: number;
  description: string;
  id: string;
  lat: string;
  lng: string;
  number: string;
  numberComplement: string | null;
  state: string;
  street: string;
  zipCode: string;
};

export async function GET(request: NextRequestLike) {
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
        return (
          right.customer.createdAt.getTime() - left.customer.createdAt.getTime()
        );
      });

    if (rankedCustomers.length === 0) {
      return NextResponse.json([]);
    }

    const addresses: AddressResponse[] = [];
    const seenIds = new Set<string>();

    for (const item of rankedCustomers) {
      for (const address of item.customer.addresses) {
        if (seenIds.has(address.id)) continue;
        seenIds.add(address.id);
        addresses.push({
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
          expectedHandoffDuration: address.expectedHandoffDuration ?? 300,
        });
      }
    }

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("GET /public/customers/addresses error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
