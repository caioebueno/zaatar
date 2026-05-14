import type { AccessTokenPayload } from "./AccessTokenSigner.js";

export interface AccessTokenVerifier {
  verify(token: string): AccessTokenPayload | null;
}
