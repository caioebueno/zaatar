export type AccessTokenPayload = {
  email: string;
  name: string;
  userId: string;
};

export type SignedAccessToken = {
  accessToken: string;
  expiresAt: Date;
};

export interface AccessTokenSigner {
  sign(payload: AccessTokenPayload): SignedAccessToken;
}
