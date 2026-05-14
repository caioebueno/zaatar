export type DriverAccessTokenPayload = {
  driverId: string;
  name: string;
  phone: string;
};

export type DriverAccessTokenVerifier = {
  verify(token: string): DriverAccessTokenPayload | null;
};
