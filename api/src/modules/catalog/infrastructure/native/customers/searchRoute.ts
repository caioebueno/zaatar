import prisma from "../../../../../prisma.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";
import {
  buildPhoneCandidates,
  CustomerWithAddresses,
  mapCustomer,
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
      })
      .slice(0, 5)
      .map((item) => mapCustomer(item.customer));

    return NextResponse.json(rankedCustomers);
  } catch (error) {
    console.error("GET /customers/search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
