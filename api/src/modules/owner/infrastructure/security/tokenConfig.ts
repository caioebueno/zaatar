export function resolveManagerTokenSecret(): string {
  const configured = process.env.MANAGER_ACCESS_TOKEN_SECRET?.trim();

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing MANAGER_ACCESS_TOKEN_SECRET");
  }

  return "dev-manager-secret-change-me";
}
