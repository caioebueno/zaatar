import { verifyCustomerOtpAndIssueToken } from "@/src/customerOtpAuth";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  phone?: unknown;
  code?: unknown;
};

function parseRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  const normalized = value.trim();
  if (!normalized) {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  return normalized;
}

function extractClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip")?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;

    const phone = parseRequiredString(body.phone, "phone");
    const code = parseRequiredString(body.code, "code");

    const result = await verifyCustomerOtpAndIssueToken({
      rawPhone: phone,
      code,
      userAgent: request.headers.get("user-agent"),
      ipAddress: extractClientIp(request),
    });

    return NextResponse.json(result);
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "OTP_NOT_FOUND_OR_EXPIRED"
    ) {
      return NextResponse.json(
        {
          error: "OTP expired or not found",
          field: "code",
        },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "OTP_INVALID"
    ) {
      const remainingAttempts =
        "details" in error &&
        typeof (error as { details?: { remainingAttempts?: number } }).details
          ?.remainingAttempts === "number"
          ? (error as { details?: { remainingAttempts?: number } }).details
              ?.remainingAttempts
          : undefined;

      return NextResponse.json(
        {
          error: "Invalid verification code",
          field: "code",
          ...(remainingAttempts !== undefined
            ? { remainingAttempts }
            : {}),
        },
        { status: 400 },
      );
    }

    console.error("POST /api/customers/auth/otp/verify error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
