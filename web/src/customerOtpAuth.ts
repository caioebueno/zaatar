import prisma from "@/prisma";
import { randomInt, randomUUID, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { buildPhoneCandidates, getDefaultCountryCode, normalizePhoneWithCountryCode } from "@/src/phone";
import type TCustomer from "@/src/types/customer";
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from "@/src/whatsappApi";

type TOtpChannel = "WHATSAPP" | "SMS";

type TCustomerRow = {
  id: string;
  name: string | null;
  phone: string | null;
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

type TCustomerRewardRow = {
  id: string;
  type: "FREE_PRODUCT" | "PERCENT_DISCOUNT" | "FIXED_DISCOUNT" | "CUSTOM";
  title: string;
  description: string | null;
  quantity: number | null;
  value: number | null;
  productId: string | null;
  productName: string | null;
  expiresAt: Date | null;
};

type TCustomerCardRow = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

type TSendOtpInput = {
  rawPhone: string;
  channel: TOtpChannel;
  countryCode?: string;
  language?: string;
  sendAlsoSms?: boolean;
  sendAlsoWhatsApp?: boolean;
};

type TVerifyOtpInput = {
  rawPhone: string;
  code: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

type TRefreshAccessTokenInput = {
  accessToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

type TAuthSessionPayload = {
  customer: TCustomer;
  accessToken: string;
  expiresAt: string;
};

const OTP_LENGTH = 6;
const DEFAULT_OTP_TTL_MINUTES = 10;
const DEFAULT_ACCESS_TOKEN_TTL_DAYS = 90;
const DEFAULT_TWILIO_OTP_TEMPLATE_SID_EN =
  "HX7d3c229f202570036c7838d8951ac1d7";
const DEFAULT_TWILIO_OTP_TEMPLATE_SID_ES =
  "HX0dcdfc25d4e6dc915a570ef56f1354c2";
const DEFAULT_TWILIO_OTP_TEMPLATE_SID_PT =
  "HX91a939302f70b34982dc0a929bd52212";

function getAuthSecret(): string {
  return (
    process.env.CUSTOMER_AUTH_SECRET?.trim() ||
    process.env.TWILIO_AUTH_TOKEN?.trim() ||
    "local-dev-customer-auth-secret"
  );
}

function getOtpTtlMinutes(): number {
  const raw = process.env.CUSTOMER_OTP_TTL_MINUTES?.trim();
  const parsed = raw ? Number(raw) : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_OTP_TTL_MINUTES;
  }

  return Math.floor(parsed);
}

function getAccessTokenTtlDays(): number {
  const raw = process.env.CUSTOMER_ACCESS_TOKEN_TTL_DAYS?.trim();
  const parsed = raw ? Number(raw) : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_ACCESS_TOKEN_TTL_DAYS;
  }

  return Math.floor(parsed);
}

function hashValue(value: string): string {
  return createHash("sha256")
    .update(`${getAuthSecret()}::${value}`)
    .digest("hex");
}

function hashOtpCode(phone: string, code: string): string {
  return hashValue(`otp:${phone}:${code}`);
}

function hashAccessToken(token: string): string {
  return hashValue(`token:${token}`);
}

function verifyHash(raw: string, expectedHash: string): boolean {
  const rawHash = hashValue(raw);
  const expected = Buffer.from(expectedHash, "hex");
  const current = Buffer.from(rawHash, "hex");

  if (expected.length !== current.length) return false;

  return timingSafeEqual(expected, current);
}

function normalizePhoneInput(rawPhone: string, countryCode?: string): {
  normalizedPhone: string;
  countryCode: string;
} {
  const normalizedCountryCode = (countryCode || getDefaultCountryCode()).replace(
    /\D/g,
    "",
  );
  const normalizedPhone = normalizePhoneWithCountryCode(rawPhone, normalizedCountryCode);

  if (!normalizedPhone) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "phone" },
    };
  }

  return {
    normalizedPhone,
    countryCode: normalizedCountryCode,
  };
}

function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  return randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

function generateAccessToken(): string {
  return randomBytes(48).toString("base64url");
}

function normalizeTemplateLanguage(value: string | null | undefined): "en" | "pt" | "es" {
  const normalizedValue = (value || "").trim().toLowerCase();
  const baseLanguage = normalizedValue.split("-")[0];

  if (baseLanguage === "pt" || baseLanguage === "es") {
    return baseLanguage;
  }

  return "en";
}

function resolveOtpTemplateSid(language: "en" | "pt" | "es"): string {
  if (language === "pt") {
    return (
      process.env.TWILIO_CUSTOMER_OTP_TEMPLATE_SID_PT?.trim() ||
      DEFAULT_TWILIO_OTP_TEMPLATE_SID_PT
    );
  }

  if (language === "es") {
    return (
      process.env.TWILIO_CUSTOMER_OTP_TEMPLATE_SID_ES?.trim() ||
      DEFAULT_TWILIO_OTP_TEMPLATE_SID_ES
    );
  }

  return (
    process.env.TWILIO_CUSTOMER_OTP_TEMPLATE_SID_EN?.trim() ||
    process.env.TWILIO_CUSTOMER_OTP_TEMPLATE_SID?.trim() ||
    DEFAULT_TWILIO_OTP_TEMPLATE_SID_EN
  );
}

async function sendTwilioVerifySmsMessage(input: {
  phone: string;
  code: string;
  language?: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  const baseUrl = (
    process.env.TWILIO_VERIFY_API_BASE_URL?.trim() || "https://verify.twilio.com"
  ).replace(/\/$/, "");

  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN are not configured");
  }

  if (!verifyServiceSid) {
    throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured");
  }

  const endpoint = `${baseUrl}/v2/Services/${verifyServiceSid}/Verifications`;
  const locale = normalizeTemplateLanguage(input.language);
  const params = new URLSearchParams({
    To: `+${input.phone}`,
    Channel: "sms",
    CustomCode: input.code,
    Locale: locale,
  });

  const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authorization,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Twilio Verify SMS API request failed (${response.status}): ${errorBody}`,
    );
  }
}

async function sendOtpMessage(input: {
  phone: string;
  code: string;
  channel: TOtpChannel;
  language?: string;
  sendAlsoSms?: boolean;
  sendAlsoWhatsApp?: boolean;
}) {
  const templateLanguage = normalizeTemplateLanguage(input.language);
  const otpTemplateSid = resolveOtpTemplateSid(templateLanguage);

  const sendViaSms = async () => {
    await sendTwilioVerifySmsMessage({
      phone: input.phone,
      code: input.code,
      language: input.language,
    });
  };

  const sendViaWhatsApp = async () => {
    if (otpTemplateSid) {
      await sendWhatsAppTemplateMessage({
        customerPhone: input.phone,
        contentSid: otpTemplateSid,
        contentVariables: {
          "1": input.code,
        },
      });
      return;
    }

    await sendWhatsAppTextMessage({
      customerPhone: input.phone,
      content: `${input.code} is your verification code. It expires in ${getOtpTtlMinutes()} minutes.`,
    });
  };

  if (input.channel === "SMS") {
    await sendViaSms();
  } else {
    await sendViaWhatsApp();
  }

  if (input.sendAlsoSms && input.channel !== "SMS") {
    try {
      await sendViaSms();
    } catch (error) {
      console.error("Failed to send OTP via SMS secondary channel:", error);
    }
  }

  if (input.sendAlsoWhatsApp && input.channel !== "WHATSAPP") {
    try {
      await sendViaWhatsApp();
    } catch (error) {
      console.error(
        "Failed to send OTP via WhatsApp secondary channel:",
        error,
      );
    }
  }
}

async function findOrCreateCustomerByPhone(
  normalizedPhone: string,
): Promise<{ id: string; phone: string | null; name: string | null }> {
  const customer = await prisma.customer.findFirst({
    where: {
      phone: {
        in: buildPhoneCandidates(normalizedPhone),
      },
    },
    select: {
      id: true,
      phone: true,
      name: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (customer) {
    if (customer.phone !== normalizedPhone) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { phone: normalizedPhone },
      });
    }

    return {
      id: customer.id,
      phone: normalizedPhone,
      name: customer.name,
    };
  }

  const createdCustomer = await prisma.customer.create({
    data: {
      id: randomUUID(),
      phone: normalizedPhone,
    },
    select: {
      id: true,
      phone: true,
      name: true,
    },
  });

  return createdCustomer;
}

async function loadCustomerSessionCustomer(customerId: string): Promise<TCustomer> {
  const customer = (await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      addresses: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })) as TCustomerRow | null;

  if (!customer) {
    throw {
      code: "CUSTOMER_NOT_FOUND",
    };
  }

  const rewards = await prisma.$queryRaw<TCustomerRewardRow[]>`
    SELECT
      cr."id",
      cr."type",
      cr."title",
      cr."description",
      cr."quantity",
      cr."value",
      cr."productId",
      p."name" AS "productName",
      cr."expiresAt"
    FROM "CustomerReward" cr
    LEFT JOIN "Product" p ON p."id" = cr."productId"
    WHERE cr."customerId" = ${customerId}
      AND cr."status" = 'ACTIVE'
      AND (cr."expiresAt" IS NULL OR cr."expiresAt" >= NOW())
    ORDER BY cr."createdAt" DESC
  `;

  const cards = await prisma.$queryRaw<TCustomerCardRow[]>`
    SELECT
      "id",
      "brand",
      "last4",
      "expMonth",
      "expYear",
      "isDefault"
    FROM "CustomerCard"
    WHERE "customerId" = ${customerId}
    ORDER BY "isDefault" DESC, "createdAt" ASC
  `;

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
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
      complement: address.complement || undefined,
      numberComplement: address.numberComplement || undefined,
      customerId: address.customerId || undefined,
      deliveryFee: address.deliveryFee,
    })),
    cards: cards.map((card) => ({
      id: card.id,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
      isDefault: card.isDefault,
    })),
    rewards: rewards.map((reward) => ({
      id: reward.id,
      type: reward.type,
      title: reward.title,
      description: reward.description,
      quantity: reward.quantity,
      value: reward.value,
      productId: reward.productId,
      productName: reward.productName,
      expiresAt: reward.expiresAt ? reward.expiresAt.toISOString() : null,
    })),
  };
}

function computeAccessTokenExpiryDate(now = new Date()): Date {
  const ttlDays = getAccessTokenTtlDays();
  return new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
}

export async function sendCustomerOtp(input: TSendOtpInput): Promise<void> {
  const { normalizedPhone, countryCode } = normalizePhoneInput(
    input.rawPhone,
    input.countryCode,
  );

  const customer = await findOrCreateCustomerByPhone(normalizedPhone);
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + getOtpTtlMinutes() * 60 * 1000);

  await prisma.customerOtpChallenge.create({
    data: {
      id: randomUUID(),
      customerId: customer.id,
      phone: normalizedPhone,
      countryCode,
      channel: input.channel,
      codeHash: hashOtpCode(normalizedPhone, code),
      expiresAt,
      maxAttempts: 5,
    },
  });

  await sendOtpMessage({
    phone: normalizedPhone,
    code,
    channel: input.channel,
    language: input.language,
    sendAlsoSms: input.sendAlsoSms,
    sendAlsoWhatsApp: input.sendAlsoWhatsApp,
  });
}

export async function verifyCustomerOtpAndIssueToken(
  input: TVerifyOtpInput,
): Promise<TAuthSessionPayload> {
  const { normalizedPhone } = normalizePhoneInput(input.rawPhone);
  const normalizedCode = input.code.trim();

  if (!/^\d{4,8}$/.test(normalizedCode)) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "code" },
    };
  }

  const challenge = await prisma.customerOtpChallenge.findFirst({
    where: {
      phone: normalizedPhone,
      usedAt: null,
      expiresAt: {
        gte: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!challenge) {
    throw {
      code: "OTP_NOT_FOUND_OR_EXPIRED",
      details: { field: "code" },
    };
  }

  if (challenge.attemptCount >= challenge.maxAttempts) {
    await prisma.customerOtpChallenge.update({
      where: { id: challenge.id },
      data: {
        usedAt: challenge.usedAt || new Date(),
      },
    });

    throw {
      code: "OTP_NOT_FOUND_OR_EXPIRED",
      details: { field: "code" },
    };
  }

  const nextAttempts = challenge.attemptCount + 1;
  const isCodeValid = verifyHash(
    `otp:${normalizedPhone}:${normalizedCode}`,
    challenge.codeHash,
  );

  if (!isCodeValid) {
    await prisma.customerOtpChallenge.update({
      where: { id: challenge.id },
      data: {
        attemptCount: nextAttempts,
        lastAttemptAt: new Date(),
        ...(nextAttempts >= challenge.maxAttempts ? { usedAt: new Date() } : {}),
      },
    });

    throw {
      code: "OTP_INVALID",
      details: {
        field: "code",
        remainingAttempts: Math.max(challenge.maxAttempts - nextAttempts, 0),
      },
    };
  }

  const accessToken = generateAccessToken();
  const expiresAtDate = computeAccessTokenExpiryDate();
  const customerId =
    challenge.customerId ||
    (await findOrCreateCustomerByPhone(normalizedPhone)).id;

  await prisma.$transaction(async (tx) => {
    await tx.customerOtpChallenge.update({
      where: { id: challenge.id },
      data: {
        usedAt: new Date(),
        attemptCount: nextAttempts,
        lastAttemptAt: new Date(),
      },
    });

    await tx.customerAccessToken.create({
      data: {
        id: randomUUID(),
        customerId,
        tokenHash: hashAccessToken(accessToken),
        expiresAt: expiresAtDate,
        lastUsedAt: new Date(),
        userAgent: input.userAgent || null,
        ipAddress: input.ipAddress || null,
      },
    });
  });

  const customerRecord = await prisma.customer.findFirst({
    where: {
      phone: {
        in: buildPhoneCandidates(normalizedPhone),
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!customerRecord) {
    throw {
      code: "CUSTOMER_NOT_FOUND",
    };
  }

  const customer = await loadCustomerSessionCustomer(customerRecord.id);

  return {
    customer,
    accessToken,
    expiresAt: expiresAtDate.toISOString(),
  };
}

export async function refreshCustomerAccessToken(
  input: TRefreshAccessTokenInput,
): Promise<TAuthSessionPayload> {
  const rawToken = input.accessToken.trim();
  if (!rawToken) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "accessToken" },
    };
  }

  const tokenHash = hashAccessToken(rawToken);
  const now = new Date();

  const tokenRecord = await prisma.customerAccessToken.findUnique({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      customerId: true,
      revokedAt: true,
      expiresAt: true,
    },
  });

  if (
    !tokenRecord ||
    tokenRecord.revokedAt !== null ||
    tokenRecord.expiresAt.getTime() <= now.getTime()
  ) {
    throw {
      code: "ACCESS_TOKEN_INVALID",
    };
  }

  const nextExpiresAt = computeAccessTokenExpiryDate(now);

  await prisma.customerAccessToken.update({
    where: { id: tokenRecord.id },
    data: {
      expiresAt: nextExpiresAt,
      lastUsedAt: now,
      userAgent: input.userAgent || null,
      ipAddress: input.ipAddress || null,
    },
  });

  const customer = await loadCustomerSessionCustomer(tokenRecord.customerId);

  return {
    customer,
    accessToken: rawToken,
    expiresAt: nextExpiresAt.toISOString(),
  };
}

export function parseOtpChannel(value: unknown): TOtpChannel {
  if (value === undefined || value === null) return "WHATSAPP";
  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "channel" },
    };
  }

  const normalized = value.trim().toUpperCase();

  if (normalized !== "WHATSAPP" && normalized !== "SMS") {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "channel" },
    };
  }

  return normalized;
}
