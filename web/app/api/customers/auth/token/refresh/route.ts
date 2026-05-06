import { refreshCustomerAccessToken } from "@/src/customerOtpAuth";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  accessToken?: unknown;
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
    const accessToken = parseRequiredString(body.accessToken, "accessToken");

    const result = await refreshCustomerAccessToken({
      accessToken,
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
      (error as { code?: string }).code === "ACCESS_TOKEN_INVALID"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("POST /api/customers/auth/token/refresh error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
