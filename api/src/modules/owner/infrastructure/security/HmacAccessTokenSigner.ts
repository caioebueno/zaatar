import { createHmac } from "node:crypto";
import type {
  AccessTokenPayload,
  AccessTokenSigner,
  SignedAccessToken,
} from "../../application/ports/AccessTokenSigner.js";
import { resolveManagerTokenSecret } from "./tokenConfig.js";

const DEFAULT_TTL_DAYS = 90;

type TokenEnvelope = {
  email: string;
  exp: number;
  iat: number;
  name: string;
  sub: string;
};

export class HmacAccessTokenSigner implements AccessTokenSigner {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor(input?: { secret?: string; ttlDays?: number }) {
    this.secret = input?.secret?.trim() || resolveManagerTokenSecret();

    const ttlDays = normalizeTtlDays(input?.ttlDays);
    this.ttlSeconds = ttlDays * 24 * 60 * 60;
  }

  sign(payload: AccessTokenPayload): SignedAccessToken {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expSeconds = nowSeconds + this.ttlSeconds;

    const header = { alg: "HS256", typ: "JWT" };
    const body: TokenEnvelope = {
      sub: payload.userId,
      email: payload.email,
      name: payload.name,
      iat: nowSeconds,
      exp: expSeconds,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedBody = base64UrlEncode(JSON.stringify(body));
    const signature = createHmac("sha256", this.secret)
      .update(`${encodedHeader}.${encodedBody}`)
      .digest("base64url");

    return {
      accessToken: `${encodedHeader}.${encodedBody}.${signature}`,
      expiresAt: new Date(expSeconds * 1000),
    };
  }
}

function normalizeTtlDays(value: number | undefined): number {
  const raw =
    value ?? Number.parseInt(process.env.MANAGER_ACCESS_TOKEN_TTL_DAYS ?? "", 10);

  if (!Number.isInteger(raw) || raw < 1) {
    return DEFAULT_TTL_DAYS;
  }

  return raw;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}
