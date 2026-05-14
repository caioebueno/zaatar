import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  DriverAccessTokenPayload,
  DriverAccessTokenVerifier,
} from "../../application/ports/DriverAccessTokenVerifier.js";
import { resolveDriverTokenSecret } from "./tokenConfig.js";

type TokenEnvelope = {
  exp: unknown;
  iat: unknown;
  name: unknown;
  phone: unknown;
  role: unknown;
  sub: unknown;
};

export class HmacDriverAccessTokenVerifier implements DriverAccessTokenVerifier {
  private readonly secret: string;

  constructor(input?: { secret?: string }) {
    this.secret = input?.secret?.trim() || resolveDriverTokenSecret();
  }

  verify(token: string): DriverAccessTokenPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const expectedSignature = createHmac("sha256", this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (providedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }

    let payload: TokenEnvelope;
    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, "base64url").toString("utf8"),
      ) as TokenEnvelope;
    } catch {
      return null;
    }

    const role = typeof payload.role === "string" ? payload.role : null;
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const name = typeof payload.name === "string" ? payload.name : null;
    const phone = typeof payload.phone === "string" ? payload.phone : null;
    const exp = typeof payload.exp === "number" ? payload.exp : null;

    if (role !== "driver" || !sub || !name || !phone || !exp) {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (exp <= nowSeconds) {
      return null;
    }

    return {
      driverId: sub,
      name,
      phone,
    };
  }
}
