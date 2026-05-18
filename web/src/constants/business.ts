export const BUSINESS_ID_HEADER_NAME = "x-business-id";
export const BUSINESS_ID_COOKIE_NAME = "foody_business_id";

function readEnvBusinessId(): string | null {
  const rawValue =
    process.env.NEXT_PUBLIC_BUSINESS_ID?.trim() ||
    process.env.BUSINESS_ID?.trim() ||
    "";

  return rawValue.length > 0 ? rawValue : null;
}

export function getConfiguredBusinessId(): string | null {
  return readEnvBusinessId();
}
