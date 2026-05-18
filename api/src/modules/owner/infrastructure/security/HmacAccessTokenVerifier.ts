import { createHmac, timingSafeEqual } from "node:crypto";
import type { AccessTokenPayload } from "../../application/ports/AccessTokenSigner.js";
import type { AccessTokenVerifier } from "../../application/ports/AccessTokenVerifier.js";
import { resolveManagerTokenSecret } from "./tokenConfig.js";

type TokenEnvelope = {
  email: unknown;
  exp: unknown;
  iat: unknown;
  name: unknown;
  sub: unknown;
};

export class HmacAccessTokenVerifier implements AccessTokenVerifier {
  private readonly secret: string;

  constructor(input?: { secret?: string }) {
    this.secret = input?.secret?.trim() || resolveManagerTokenSecret();
  }

  verify(token: string): AccessTokenPayload | null {
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

    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const name = typeof payload.name === "string" ? payload.name : null;
    const exp = typeof payload.exp === "number" ? payload.exp : null;

    if (!sub || !email || !name || !exp) {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (exp <= nowSeconds) {
      return null;
    }

    return {
      userId: sub,
      email,
      name,
    };
  }
}
