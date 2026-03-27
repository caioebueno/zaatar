"use client";

import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";

type TNominatimAddress = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
};

export type TAddressValue = {
  label: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat: number;
  lon: number;
  placeId: number;
  raw: TNominatimAddress;
};

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (value: TAddressValue | null) => void;
  selected?: TAddressValue | null
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
};

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

function buildStreet1(address?: TNominatimAddress["address"]) {
  const houseNumber = address?.house_number?.trim() ?? "";
  const road = address?.road?.trim() ?? "";
  return [houseNumber, road].filter(Boolean).join(" ");
}

function buildCity(address?: TNominatimAddress["address"]) {
  return (
    address?.city?.trim() ||
    address?.town?.trim() ||
    address?.village?.trim() ||
    ""
  );
}

function hasHouseNumber(item: TNominatimAddress) {
  return !!item.address?.house_number?.trim();
}

export default function AddressAutocompleteInput({
  value = "",
  onChange,
  onSelect,
  placeholder = "Street address",
  disabled = false,
  className = "",
  required = false,
  selected
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<TNominatimAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [error, setError] = useState("");

  const debouncedQuery = useDebouncedValue(query, 350);

  useEffect(() => {
    if (!selected) {
      setQuery(value);
    }
  }, [value, selected]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (selected || trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function searchAddresses() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/address-search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to search addresses");
        }

        const data = (await response.json()) as TNominatimAddress[];
        setResults(data);
        setOpen(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setError("Could not load addresses.");
        }
      } finally {
        setLoading(false);
      }
    }

    searchAddresses();

    return () => controller.abort();
  }, [debouncedQuery, selected]);

  function handleInputChange(nextValue: string) {
    if (selected) return;

    setQuery(nextValue);
    setError("");
    onChange?.(nextValue);
    setOpen(true);
  }

  function handleSelect(item: TNominatimAddress) {
    if (!hasHouseNumber(item)) {
      setError("Please select a full street address with house number.");
      return;
    }

    const selectedValue: TAddressValue = {
      label: item.display_name,
      street1: buildStreet1(item.address),
      city: buildCity(item.address),
      state: item.address?.state ?? "",
      zip: item.address?.postcode ?? "",
      country: item.address?.country ?? "United States",
      lat: Number(item.lat),
      lon: Number(item.lon),
      placeId: item.place_id,
      raw: item,
    };
    setQuery(selectedValue.label);
    onSelect && onSelect(selectedValue);
    setOpen(false);
    setError("");
    setResults([]);

    onChange?.(selectedValue.label);
    onSelect?.(selectedValue);
  }

  function handleClearSelection() {
    onSelect && onSelect(null);
    setQuery("");
    setResults([]);
    setOpen(false);
    setError("");

    onChange?.("");
    onSelect?.(null);
  }

  function handleBlur() {
    if (!query.trim()) {
      if (required) {
        setError("Address is required.");
      }
      return;
    }

    if (!selected) {
      setError("Please choose a suggested US address with house number.");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-semibold">Address</span>
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div
        className={`flex items-center rounded-xl text-lg transition bg-foreground focus-within:border-brandBackground border-2 border-foreground ${
          error ? "border-red-500" : "border-foreground"
        }`}
      >
        <input
          type="text"
          value={query}
          disabled={disabled}
          readOnly={!!selected}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (!selected && results.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full rounded-xl bg-transparent px-3 py-3 outline-none"
        />

        {selected && !disabled && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Clear selected address"
          >
              <FiX size={ 16} />
          </button>
        )}
      </div>

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}

      {open && (loading || results.length > 0) && !selected && (
        <div className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-neutral-500">
              Searching...
            </div>
          )}

          {!loading &&
            results.map((item) => {
              const street1 = buildStreet1(item.address);
              const city = buildCity(item.address);

              return (
                <button
                  key={item.place_id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                  className="block w-full border-b border-neutral-100 px-3 py-3 text-left hover:bg-neutral-50 last:border-b-0"
                >
                  <div className="text-sm font-medium text-neutral-900">
                    {street1 || item.display_name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {[city, item.address?.state, item.address?.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </button>
              );
            })}

          {!loading && results.length === 0 && debouncedQuery.trim().length >= 3 && (
            <div className="px-3 py-2 text-sm text-neutral-500">
              No US street addresses with house number found
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
