export type DriverAccessTokenPayload = {
  driverId: string;
  name: string;
  phone: string;
};

export type SignedDriverAccessToken = {
  accessToken: string;
  expiresAt: Date;
};

export type DriverAccessTokenSigner = {
  sign(payload: DriverAccessTokenPayload): SignedDriverAccessToken;
};
