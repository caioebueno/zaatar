export function resolveDriverTokenSecret(): string {
  const configured = process.env.DRIVER_ACCESS_TOKEN_SECRET?.trim();
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing DRIVER_ACCESS_TOKEN_SECRET");
  }

  return "dev-driver-access-token-secret-change-me";
}
