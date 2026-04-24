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
  const raw = rawPhone.trim();
  const normalized = normalizePhoneDigits(rawPhone);
  if (!normalized) return undefined;

  const normalizedCountryCode = normalizePhoneDigits(countryCode);

  // Keep explicit international numbers as-is (without symbols).
  if (raw.startsWith("+") || raw.startsWith("00")) {
    return normalized;
  }

  if (!normalizedCountryCode) return normalized;

  if (normalized.startsWith(normalizedCountryCode)) {
    return normalized;
  }

  // If it already looks like an international number (e.g. 55...),
  // do not force the default country code in front.
  if (normalized.length >= 11) {
    return normalized;
  }

  return `${normalizedCountryCode}${normalized}`;
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
