/**
 * Best-effort international phone identification + formatting.
 *
 * Given a raw phone string, detects the country from its dial code (when the
 * number is in international / E.164 form) and formats the national part using
 * that country's grouping convention. Falls back gracefully for numbers with no
 * country code (assumes US/CA for 10-digit numbers) or unknown codes.
 */

type PhoneCountry = {
  iso: string;
  name: string;
  dial: string; // digits only, no "+"
  natLens: number[]; // plausible national-number lengths
  format: (national: string) => string;
};

/** Fills `national` digits into a `#` mask; trailing digits beyond the mask are appended. */
function mask(national: string, pattern: string): string {
  let out = "";
  let di = 0;
  for (let i = 0; i < pattern.length && di < national.length; i++) {
    out += pattern[i] === "#" ? national[di++] : pattern[i];
  }
  if (di < national.length) out += (out ? " " : "") + national.slice(di);
  return out;
}

// Ordered so that longer dial codes are tested before shorter ones.
const COUNTRIES: PhoneCountry[] = [
  { iso: "PT", name: "Portugal", dial: "351", natLens: [9], format: (n) => mask(n, "### ### ###") },
  { iso: "BR", name: "Brazil", dial: "55", natLens: [10, 11], format: (n) => mask(n, n.length === 11 ? "(##) #####-####" : "(##) ####-####") },
  { iso: "MX", name: "Mexico", dial: "52", natLens: [10], format: (n) => mask(n, "## #### ####") },
  { iso: "GB", name: "United Kingdom", dial: "44", natLens: [9, 10], format: (n) => mask(n, "#### ######") },
  { iso: "IN", name: "India", dial: "91", natLens: [10], format: (n) => mask(n, "##### #####") },
  { iso: "AU", name: "Australia", dial: "61", natLens: [9], format: (n) => mask(n, "### ### ###") },
  { iso: "ES", name: "Spain", dial: "34", natLens: [9], format: (n) => mask(n, "### ### ###") },
  { iso: "DE", name: "Germany", dial: "49", natLens: [10, 11], format: (n) => mask(n, "### ########") },
  { iso: "FR", name: "France", dial: "33", natLens: [9], format: (n) => mask(n, "# ## ## ## ##") },
  { iso: "IT", name: "Italy", dial: "39", natLens: [9, 10], format: (n) => mask(n, "### ### ####") },
  { iso: "US", name: "United States", dial: "1", natLens: [10], format: (n) => mask(n, "(###) ###-####") },
];

export type ParsedPhone = {
  iso: string | null;
  dialCode: string | null; // e.g. "+1"
  national: string;
  formatted: string; // display string
};

function matchCountry(digits: string): PhoneCountry | null {
  for (const c of COUNTRIES) {
    if (digits.startsWith(c.dial) && c.natLens.includes(digits.length - c.dial.length)) {
      return c;
    }
  }
  return null;
}

export function parsePhone(raw: string | null | undefined): ParsedPhone | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return { iso: null, dialCode: null, national: "", formatted: trimmed };

  // International form: identify country by its dial code.
  if (hasPlus || digits.length > 10) {
    const country = matchCountry(digits);
    if (country) {
      const national = digits.slice(country.dial.length);
      return {
        iso: country.iso,
        dialCode: "+" + country.dial,
        national,
        formatted: "+" + country.dial + " " + country.format(national),
      };
    }
    if (hasPlus) return { iso: null, dialCode: null, national: digits, formatted: "+" + digits };
  }

  // No country code — assume US/CA (the common default for local numbers here).
  if (digits.length === 10) {
    return { iso: "US", dialCode: "+1", national: digits, formatted: mask(digits, "(###) ###-####") };
  }
  if (digits.length === 11 && digits[0] === "1") {
    const national = digits.slice(1);
    return { iso: "US", dialCode: "+1", national, formatted: "+1 " + mask(national, "(###) ###-####") };
  }

  return { iso: null, dialCode: null, national: digits, formatted: trimmed };
}

/** Formats a raw phone string for display, per detected country. */
export function formatPhone(raw: string | null | undefined): string {
  return parsePhone(raw)?.formatted ?? "";
}
