import { refreshCustomerAccessToken } from "@/src/customerOtpAuth";
import type TCustomer from "@/src/types/customer";
import { NextRequest } from "next/server";

type AuthContext = {
  customer: TCustomer;
  accessToken: string;
  expiresAt: string;
};

export function extractClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip")?.trim() || null;
}

export function extractAccessToken(request: NextRequest, body?: unknown): string {
  const authorization = request.headers.get("authorization")?.trim() || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    const tokenFromHeader = authorization.slice(7).trim();
    if (tokenFromHeader) return tokenFromHeader;
  }

  if (
    body &&
    typeof body === "object" &&
    "accessToken" in body &&
    typeof (body as { accessToken?: unknown }).accessToken === "string"
  ) {
    const tokenFromBody = (body as { accessToken: string }).accessToken.trim();
    if (tokenFromBody) return tokenFromBody;
  }

  throw new Error("accessToken");
}

export async function authenticateCustomerByAccessToken(input: {
  accessToken: string;
  request: NextRequest;
}): Promise<AuthContext> {
  const session = await refreshCustomerAccessToken({
    accessToken: input.accessToken,
    userAgent: input.request.headers.get("user-agent"),
    ipAddress: extractClientIp(input.request),
  });

  return {
    customer: session.customer,
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
  };
}
