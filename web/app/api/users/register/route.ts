import prisma from "@/prisma";
import { hashPassword } from "@/src/lib/password";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
};

function normalizeRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(field);
  }

  return normalized;
}

function normalizeEmail(value: unknown): string {
  const email = normalizeRequiredString(value, "email").toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error("email");
  }

  return email;
}

function normalizePassword(value: unknown): string {
  const password = normalizeRequiredString(value, "password");

  if (password.length < 8) {
    throw new Error("password");
  }

  return password;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody;
    const name = normalizeRequiredString(body.name, "name");
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);
    const passwordHash = await hashPassword(password);

    await prisma.$executeRaw`
      INSERT INTO "User" (
        "id",
        "createdAt",
        "updatedAt",
        "name",
        "email",
        "passwordHash"
      )
      VALUES (
        ${randomUUID()},
        NOW(),
        NOW(),
        ${name},
        ${email},
        ${passwordHash}
      )
    `;

    return NextResponse.json(
      {
        ok: true,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2010" &&
      "meta" in error &&
      typeof (error as { meta?: unknown }).meta === "object" &&
      (error as { meta?: { code?: string } }).meta?.code === "23505"
    ) {
      return NextResponse.json(
        { error: "Email already registered", field: "email" },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("POST /api/users/register error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
