export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function getDefaultCountryCode(): string {
  return (process.env.WHATSAPP_COUNTRY_CODE?.trim() || "1").replace(/\D/g, "");
}

export function normalizePhoneWithCountryCode(
  rawPhone: string,
  countryCode = getDefaultCountryCode(),
): string | undefined {
  const normalized = normalizePhoneDigits(rawPhone);
  if (!normalized) return undefined;

  if (!countryCode) return normalized;

  if (normalized.startsWith(countryCode)) {
    return normalized;
  }

  return `${countryCode}${normalized}`;
}

export function buildPhoneCandidates(
  rawPhone: string,
  countryCode = getDefaultCountryCode(),
): string[] {
  const normalized = normalizePhoneDigits(rawPhone);
  if (!normalized) return [];

  const candidates = new Set<string>([normalized]);

  if (countryCode) {
    if (normalized.startsWith(countryCode) && normalized.length > countryCode.length) {
      candidates.add(normalized.slice(countryCode.length));
    } else if (!normalized.startsWith(countryCode)) {
      candidates.add(`${countryCode}${normalized}`);
    }
  }

  return Array.from(candidates);
}
