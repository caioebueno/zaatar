"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import {
  AsYouType,
  CountryCode,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { FiX } from "react-icons/fi";

export type PhoneValue = {
  country: CountryCode;
  raw: string;
  formatted: string;
  e164: string | null;
  isValid: boolean;
};

export function validatePhoneInternational(value: string) {
  const parsed = parsePhoneNumberFromString(value);

  return {
    isValid: parsed?.isValid() ?? false,
    e164: parsed?.isValid() ? parsed.number : null,
    country: parsed?.country ?? null,
  };
}
type PhoneInputProps = {
  defaultCountry?: CountryCode;
  value?: string;
  onChange?: (value: PhoneValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  block?: boolean;
  onClear?: () => void;
};

type CountryOption = {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
};

const PRIORITY_COUNTRIES: CountryCode[] = ["US", "BR", "CA", "GB", "MX", "CO"];

function getFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function getCountryName(code: CountryCode) {
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function getDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhone(digits: string, country: CountryCode) {
  return new AsYouType(country).input(digits);
}

function buildPhoneValue(digits: string, country: CountryCode): PhoneValue {
  const formatted = formatPhone(digits, country);
  const parsed = parsePhoneNumberFromString(formatted, country);

  return {
    country,
    raw: digits,
    formatted,
    e164: parsed?.isValid() ? parsed.number : null,
    isValid: parsed?.isValid() ?? false,
  };
}

function countDigitsBeforeCursor(value: string, cursor: number) {
  return value.slice(0, cursor).replace(/\D/g, "").length;
}

function getCursorFromDigitIndex(formatted: string, digitIndex: number) {
  if (digitIndex <= 0) return 0;
  const totalDigits = formatted.replace(/\D/g, "").length;

  if (digitIndex >= totalDigits) {
    return formatted.length;
  }

  let seenDigits = 0;

  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seenDigits += 1;
      if (seenDigits === digitIndex) {
        return i + 1;
      }
    }
  }

  return formatted.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sortCountries(countries: CountryOption[]) {
  const prioritySet = new Set(PRIORITY_COUNTRIES);

  const priority = PRIORITY_COUNTRIES.map((code) =>
    countries.find((country) => country.code === code),
  ).filter(Boolean) as CountryOption[];

  const rest = countries
    .filter((country) => !prioritySet.has(country.code))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...priority, ...rest];
}

export default function PhoneInput({
  defaultCountry = "US",
  value = "",
  onChange,
  placeholder = "Phone number",
  disabled = false,
  className = "",
  block,
  onClear,
}: PhoneInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const countries = useMemo<CountryOption[]>(() => {
    const allCountries = getCountries().map((code) => ({
      code,
      name: getCountryName(code),
      callingCode: getCountryCallingCode(code),
      flag: getFlagEmoji(code),
    }));

    return sortCountries(allCountries);
  }, []);

  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [digits, setDigits] = useState(getDigits(value));
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const phoneValue = useMemo(
    () => buildPhoneValue(digits, country),
    [digits, country],
  );

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return countries;

    const priorityMatches = countries.filter((item) => {
      const matches =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.callingCode.includes(q);

      return matches && PRIORITY_COUNTRIES.includes(item.code);
    });

    const otherMatches = countries.filter((item) => {
      const matches =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.callingCode.includes(q);

      return matches && !PRIORITY_COUNTRIES.includes(item.code);
    });

    return [
      ...priorityMatches,
      ...otherMatches.sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [countries, search]);

  useEffect(() => {
    onChange?.(phoneValue);
  }, [phoneValue, onChange]);

  useEffect(() => {
    setDigits(getDigits(value));
  }, [value]);

  useEffect(() => {
    const inputIsFocused = document.activeElement === inputRef.current;
    if (inputIsFocused) return;

    setCountry(defaultCountry);
  }, [defaultCountry]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleClear = () => {
    setDigits("");

    // notify parent (optional but you already pass it)
    onClear?.();

    // focus input again (nice UX)
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const nextDigits = getDigits(input.value);
    const digitCursor = countDigitsBeforeCursor(
      input.value,
      input.selectionStart ?? input.value.length,
    );

    setDigits(nextDigits);

    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;

      const formatted = formatPhone(nextDigits, country);
      const nextCursor = getCursorFromDigitIndex(formatted, digitCursor);

      el.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const formatted = phoneValue.formatted;

    if (e.key !== "Backspace" && e.key !== "Delete") return;

    e.preventDefault();

    const startDigitIndex = countDigitsBeforeCursor(formatted, start);
    const endDigitIndex = countDigitsBeforeCursor(formatted, end);
    const hasSelection = start !== end;

    let nextDigits = digits;
    let nextDigitCursor = startDigitIndex;

    if (hasSelection) {
      const safeStart = clamp(startDigitIndex, 0, digits.length);
      const safeEnd = clamp(endDigitIndex, safeStart, digits.length);
      nextDigits = digits.slice(0, safeStart) + digits.slice(safeEnd);
      nextDigitCursor = safeStart;
    } else if (e.key === "Backspace") {
      if (startDigitIndex <= 0) return;
      const removeAt = startDigitIndex - 1;
      nextDigits = digits.slice(0, removeAt) + digits.slice(removeAt + 1);
      nextDigitCursor = removeAt;
    } else {
      if (startDigitIndex >= digits.length) return;
      const removeAt = startDigitIndex;
      nextDigits = digits.slice(0, removeAt) + digits.slice(removeAt + 1);
      nextDigitCursor = removeAt;
    }

    setDigits(nextDigits);

    requestAnimationFrame(() => {
      const nextFormatted = formatPhone(nextDigits, country);
      const nextCursor = getCursorFromDigitIndex(nextFormatted, nextDigitCursor);
      input.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleSelectCountry(code: CountryCode) {
    setCountry(code);
    setIsOpen(false);
    setSearch("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  const selectedCountry =
    countries.find((item) => item.code === country) ?? countries[0];
  const isDisabled = Boolean(disabled || block);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="flex w-full overflow-hidden bg-white flex-row gap-px">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2  px-3 py-2 text-sm bg-foreground rounded-l-xl disabled:opacity-50 "
        >
          <span className="text-xl">{selectedCountry.flag}</span>
          <span className="text-lg">{selectedCountry.code}</span>
          <span className="text-neutral-500 text-lg">
            +{selectedCountry.callingCode}
          </span>
        </button>
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          disabled={isDisabled}
          value={phoneValue.formatted}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 disabled:opacity-50 disabled:rounded-r-none outline-none bg-foreground border-2 rounded-r-xl border-foreground focus:border-brandBackground transition text-lg"
        />
        {block && (
          <div
            onClick={handleClear}
            className="px-3 py-2 bg-foreground flex items-center justify-center rounded-r-xl"
          >
            <FiX size={18}></FiX>
          </div>
        )}
      </div>

      {/*<div className="mt-1 text-xs">
        {phoneValue.raw ? (
          phoneValue.isValid ? (
            <span className="text-green-600">Valid • {phoneValue.e164}</span>
          ) : (
            <span className="text-red-600">Invalid number</span>
          )
        ) : null}
      </div>*/}

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-neutral-300 bg-white shadow-lg">
          <div className="border-b border-neutral-200 p-2">
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none text-base"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {filteredCountries.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelectCountry(item.code)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-neutral-100"
              >
                <span className="text-lg">{item.flag}</span>
                <span className="min-w-[40px] text-sm font-medium">
                  {item.code}
                </span>
                <span className="flex-1 text-sm">{item.name}</span>
                <span className="text-sm text-neutral-500">
                  +{item.callingCode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
