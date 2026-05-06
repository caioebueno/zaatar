import { parseOtpChannel, sendCustomerOtp } from "@/src/customerOtpAuth";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  phone?: unknown;
  channel?: unknown;
  countryCode?: unknown;
  language?: unknown;
  sendAlsoSms?: unknown;
  sendAlsoWhatsApp?: unknown;
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

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function parseOptionalBoolean(
  value: unknown,
  field: string,
): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  return value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;

    const phone = parseRequiredString(body.phone, "phone");
    const channel = parseOtpChannel(body.channel);
    const countryCode = parseOptionalString(body.countryCode, "countryCode");
    const language = parseOptionalString(body.language, "language");
    const sendAlsoSms = parseOptionalBoolean(body.sendAlsoSms, "sendAlsoSms");
    const sendAlsoWhatsApp = parseOptionalBoolean(
      body.sendAlsoWhatsApp,
      "sendAlsoWhatsApp",
    );

    await sendCustomerOtp({
      rawPhone: phone,
      channel,
      countryCode,
      language,
      sendAlsoSms,
      sendAlsoWhatsApp,
    });

    return NextResponse.json({ ok: true });
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

    console.error("POST /api/customers/auth/otp/send error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
