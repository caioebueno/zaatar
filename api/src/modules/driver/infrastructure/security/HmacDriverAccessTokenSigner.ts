import { createHmac } from "node:crypto";
import type {
  DriverAccessTokenPayload,
  DriverAccessTokenSigner,
  SignedDriverAccessToken,
} from "../../application/ports/DriverAccessTokenSigner.js";
import { resolveDriverTokenSecret } from "./tokenConfig.js";

const DEFAULT_TTL_DAYS = 90;

type TokenEnvelope = {
  exp: number;
  iat: number;
  name: string;
  phone: string;
  role: "driver";
  sub: string;
};

export class HmacDriverAccessTokenSigner implements DriverAccessTokenSigner {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor(input?: { secret?: string; ttlDays?: number }) {
    this.secret = input?.secret?.trim() || resolveDriverTokenSecret();
    this.ttlSeconds = normalizeTtlDays(input?.ttlDays) * 24 * 60 * 60;
  }

  sign(payload: DriverAccessTokenPayload): SignedDriverAccessToken {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expSeconds = nowSeconds + this.ttlSeconds;

    const header = { alg: "HS256", typ: "JWT" };
    const body: TokenEnvelope = {
      sub: payload.driverId,
      name: payload.name,
      phone: payload.phone,
      role: "driver",
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
  const parsed =
    value ?? Number.parseInt(process.env.DRIVER_ACCESS_TOKEN_TTL_DAYS ?? "", 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_TTL_DAYS;
  }

  return parsed;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}
