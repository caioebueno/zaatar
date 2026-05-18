"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  setSelectedBusinessIdSession,
} from "@/src/lib/auth";
import { MarkPulse } from "./ui/ZippyLogo";
import { IconCheck, IconTriangleAlert } from "./ui/Icons";
import { Button } from "./ui/Button";
import { OnboardingStepper } from "./ui/OnboardingStepper";
import { TimeInput, timeStringToValue, valueToTimeString } from "./ui/TimeInput";

// ── Types ────────────────────────────────────────────────────────────────────

type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type BranchOperationHours = Record<WeekdayKey, Array<{ end: string; start: string }>>;

type OnboardingBranch = {
  addressCity: string | null;
  addressComplement: string | null;
  addressDescription: string;
  addressGoogleMapsUrl: string;
  addressLatitude: number | null;
  addressLongitude: number | null;
  addressNumber: string | null;
  addressNumberComplement: string | null;
  addressPlaceId: string | null;
  addressState: string | null;
  addressStreet: string | null;
  addressZipCode: string | null;
  createdAt: string;
  id: string;
  name: string;
  operationHours: unknown;
};

type MapboxAddressSuggestion = {
  city: string;
  description: string;
  latitude: number;
  longitude: number;
  number: string;
  placeId: string;
  state: string;
  street: string;
  zipCode: string;
};

export type OnboardingStatus = {
  basicInfo: {
    bannerPhotoUrl: string | null;
    brandColor: string;
    businessId: string;
    logoUrl: string | null;
    name: string;
    orderLinkUrl: string;
  };
  branches: OnboardingBranch[];
  checklist: {
    basicInfoComplete: boolean;
    branchesComplete: boolean;
    completed: boolean;
    stripeReady: boolean;
  };
  stripe: {
    accountId: string | null;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    payoutsEnabled: boolean;
    readyForPayouts: boolean;
  };
  suggestions: string[];
};

type Props = {
  initialError?: string | null;
  initialStripeReturned?: boolean;
  initialStatus: OnboardingStatus;
  initialStripeMessage?: string | null;
};

// ── Step definitions (mirrors ab-stepper.jsx STEPS array) ────────────────────

const STEPS = [
  {
    id: "business",
    label: "Business Information",
    sub: "Name and logo",
    // body: "Start with your restaurant's profile. This powers your dispatch headers and public receipt footers.",
  },
  {
    id: "branches",
    label: "Branches",
    sub: "Add restaurant branches",
    // body: "Upload a menu photo or CSV. Zippy reads it and pre-populates your item library — you clean it up from there.",
  },
  {
    id: "banking",
    label: "Banking",
    sub: "Connect Stripe account",
    // body: "Invite everyone who touches an order. Each role gets the right surface — manager gets the dashboard, driver gets the phone.",
  },
] as const;


// ── Operation hours helpers ───────────────────────────────────────────────────

const WEEK_DAYS: WeekdayKey[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const WEEK_DAY_LABELS: Record<WeekdayKey, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function defaultOperationHours(): BranchOperationHours {
  return {
    monday: [{ start: "09:00", end: "21:00" }],
    tuesday: [{ start: "09:00", end: "21:00" }],
    wednesday: [{ start: "09:00", end: "21:00" }],
    thursday: [{ start: "09:00", end: "21:00" }],
    friday: [{ start: "09:00", end: "22:00" }],
    saturday: [{ start: "10:00", end: "22:00" }],
    sunday: [{ start: "10:00", end: "21:00" }],
  };
}

function parseOperationHours(value: unknown): BranchOperationHours {
  const fallback = defaultOperationHours();
  if (!isRecord(value)) return fallback;
  const normalized: BranchOperationHours = { ...fallback };
  for (const day of WEEK_DAYS) {
    const rawValue = value[day];
    if (!Array.isArray(rawValue)) { normalized[day] = []; continue; }
    normalized[day] = rawValue
      .map((range) => {
        if (!isRecord(range)) return null;
        if (typeof range.start !== "string" || typeof range.end !== "string") return null;
        const start = range.start.trim();
        const end = range.end.trim();
        if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return null;
        return { start, end };
      })
      .filter((r): r is { end: string; start: string } => r !== null);
  }
  return normalized;
}


function hoursOverlap(ranges: Array<{ start: string; end: string }>): boolean {
  const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (toMins(ranges[i].start) < toMins(ranges[j].end) && toMins(ranges[j].start) < toMins(ranges[i].end)) return true;
    }
  }
  return false;
}

// ── Shared style constants ────────────────────────────────────────────────────

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 12.5,
  color: "var(--ink)",
  marginBottom: 5,
};

const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 11px",
  border: "1px solid rgba(22,18,15,0.16)",
  borderRadius: 8,
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "var(--ink)",
  background: "var(--paper)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const fieldHintStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 11,
  color: "var(--slate)",
};

// ── Empty branch template for the "new branch" card ─────────────────────────

const EMPTY_BRANCH: OnboardingBranch = {
  id: "__new__", name: "", addressDescription: "", addressGoogleMapsUrl: "",
  addressLatitude: null, addressLongitude: null, addressNumber: null,
  addressNumberComplement: null, addressPlaceId: null, addressState: null,
  addressStreet: null, addressZipCode: null, addressCity: null,
  addressComplement: null, createdAt: "", operationHours: null,
};

// ── BranchCardForm — self-contained editable card for a saved branch ──────────

type BranchUpdatePayload = {
  branchId: string; name: string; address: string; placeId: string;
  latitude: number; longitude: number; street: string | null; number: string | null;
  city: string | null; state: string | null; zipCode: string | null;
  complement: string | null; numberComplement: string | null;
  mapsUrl: string; operationHours: BranchOperationHours;
};

type BranchCardHandle = {
  getPayload: () => BranchUpdatePayload | null;
  hasData: () => boolean;
  validateAndShowErrors: () => boolean;
};

const BranchCardForm = forwardRef<BranchCardHandle, {
  branch: OnboardingBranch;
  idx: number;
  onDelete: () => void;
  deleting: boolean;
  onNameChange?: (name: string) => void;
  onErrorsChange?: (hasErrors: boolean) => void;
}>(function BranchCardForm({ branch, idx, onDelete, deleting, onNameChange, onErrorsChange }, ref) {
  const [name, setName] = useState(branch.name);
  const [address, setAddress] = useState(branch.addressDescription);
  const [mapsUrl, setMapsUrl] = useState(branch.addressGoogleMapsUrl);
  const [placeId, setPlaceId] = useState<string | null>(branch.addressPlaceId ?? null);
  const [latitude, setLatitude] = useState<number | null>(branch.addressLatitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(branch.addressLongitude ?? null);
  const [street, setStreet] = useState<string | null>(branch.addressStreet ?? null);
  const [number, setNumber] = useState<string | null>(branch.addressNumber ?? null);
  const [city, setCity] = useState<string | null>(branch.addressCity ?? null);
  const [bState, setBState] = useState<string | null>(branch.addressState ?? null);
  const [zipCode, setZipCode] = useState<string | null>(branch.addressZipCode ?? null);
  const [complement, setComplement] = useState<string | null>(branch.addressComplement ?? null);
  const [numberComplement, setNumberComplement] = useState<string | null>(branch.addressNumberComplement ?? null);
  const [hours, setHours] = useState<BranchOperationHours>(() => parseOperationHours(branch.operationHours));
  const [suggestions, setSuggestions] = useState<MapboxAddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [hoursErrors, setHoursErrors] = useState<Partial<Record<WeekdayKey, string>>>({});
  const [open, setOpen] = useState(true);

  // Keep a ref to the latest values so getPayload() never has stale closures
  const latest = useRef({ name, address, placeId, latitude, longitude, street, number, city, bState, zipCode, complement, numberComplement, mapsUrl, hours });
  useEffect(() => { latest.current = { name, address, placeId, latitude, longitude, street, number, city, bState, zipCode, complement, numberComplement, mapsUrl, hours }; });

  const onNameChangeRef = useRef(onNameChange);
  onNameChangeRef.current = onNameChange;
  useEffect(() => { onNameChangeRef.current?.(name); }, [name]);

  // Notify parent when error state changes
  const onErrorsChangeRef = useRef(onErrorsChange);
  onErrorsChangeRef.current = onErrorsChange;
  useEffect(() => {
    const hasErrors = !!nameError || !!addressError || Object.values(hoursErrors).some(Boolean);
    onErrorsChangeRef.current?.(hasErrors);
  }, [nameError, addressError, hoursErrors]);

  // Reactively clear errors as the user fixes fields
  useEffect(() => { if (nameError && name.trim()) setNameError(null); }, [name, nameError]);
  useEffect(() => { if (addressError && placeId) setAddressError(null); }, [placeId, addressError]);
  useEffect(() => {
    if (Object.keys(hoursErrors).length === 0) return;
    setHoursErrors(prev => {
      const next = { ...prev };
      let changed = false;
      for (const day of WEEK_DAYS) {
        if (prev[day] && !hoursOverlap(hours[day])) { delete next[day]; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [hours, hoursErrors]);

  useImperativeHandle(ref, () => ({
    hasData() { return latest.current.name.trim() !== ""; },
    getPayload() {
      const v = latest.current;
      if (!v.placeId || v.latitude === null || v.longitude === null) return null;
      return { branchId: branch.id, name: v.name, address: v.address, placeId: v.placeId, latitude: v.latitude, longitude: v.longitude, street: v.street, number: v.number, city: v.city, state: v.bState, zipCode: v.zipCode, complement: v.complement, numberComplement: v.numberComplement, mapsUrl: v.mapsUrl, operationHours: v.hours };
    },
    validateAndShowErrors() {
      const v = latest.current;
      let valid = true;
      if (!v.name.trim()) { setNameError("Name is required."); valid = false; } else setNameError(null);
      if (!v.placeId || v.latitude === null || v.longitude === null) { setAddressError("Address is required."); valid = false; } else setAddressError(null);
      const newHoursErrors: Partial<Record<WeekdayKey, string>> = {};
      for (const day of WEEK_DAYS) {
        if (hoursOverlap(v.hours[day])) { newHoursErrors[day] = "Ranges overlap."; valid = false; }
      }
      setHoursErrors(newHoursErrors);
      return valid;
    },
  }));

  useEffect(() => {
    if (placeId) { setSearching(false); setSuggestions([]); return; }
    const q = address.trim();
    if (q.length < 3) { setSuggestions([]); setSearching(false); return; }
    const id = window.setTimeout(async () => {
      setSearching(true); setAddressError(null);
      try {
        const res = await fetch(`/api/mapbox/places?q=${encodeURIComponent(q)}&limit=6`, { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as { items?: MapboxAddressSuggestion[] };
        setSuggestions(res.ok && Array.isArray(payload.items) ? payload.items : []);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 260);
    return () => window.clearTimeout(id);
  }, [address, placeId]);

  function selectAddress(item: MapboxAddressSuggestion) {
    setAddress(item.description); setPlaceId(item.placeId);
    setLatitude(item.latitude); setLongitude(item.longitude);
    setStreet(item.street || null); setNumber(item.number || null);
    setCity(item.city || null); setBState(item.state || null);
    setZipCode(item.zipCode || null); setComplement(null);
    setNumberComplement(null); setSuggestions([]); setMapsUrl(""); setAddressError(null);
  }

  function clearAddress() {
    setAddress(""); setPlaceId(null); setLatitude(null); setLongitude(null);
    setStreet(null); setNumber(null); setCity(null); setBState(null);
    setZipCode(null); setComplement(null); setNumberComplement(null);
    setSuggestions([]); setMapsUrl(""); setAddressError(null);
  }

  function setDayClosed(day: WeekdayKey, closed: boolean) {
    setHours(cur => ({ ...cur, [day]: closed ? [] : cur[day].length > 0 ? cur[day] : [{ start: "09:00", end: "21:00" }] }));
  }
  function setDayRangeValue(day: WeekdayKey, i: number, field: "start" | "end", value: string) {
    setHours(cur => { const r = [...cur[day]]; r[i] = { ...r[i], [field]: value }; return { ...cur, [day]: r }; });
  }
  function addDayRange(day: WeekdayKey) {
    setHours(cur => ({ ...cur, [day]: [...cur[day], { start: "09:00", end: "21:00" }] }));
  }
  function removeDayRange(day: WeekdayKey, i: number) {
    setHours(cur => ({ ...cur, [day]: cur[day].filter((_, j) => j !== i) }));
  }

  return (
    <div style={{  borderRadius: 12, background: "var(--paper)", display: "flex", flexDirection: "column",  width: 500 }}>
      {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "var(--cream)", borderBottom: open ? "1px solid rgba(22,18,15,0.1)" : "none" }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0, flex: 1, minWidth: 0 }}
        >
          <span className="mono" style={{ fontSize: 10, color: "var(--slate)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{name.trim() || `Branch ${idx + 1}`}</span>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--slate)", transition: "transform 150ms", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button type="button" onClick={onDelete} disabled={deleting} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: deleting ? "var(--slate)" : "#d43a2c", borderRadius: 6 }}>
          {deleting ? <span style={{ fontSize: 12 }}>…</span> : (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M8 6l1 14h6l1-14M10 10v7M14 10v7" />
            </svg>
          )}
        </button>
      </div> */}

      {open && <div className="flex flex-col gap-[20px]">
        <div>
          <label style={fieldLabelStyle}>Branch name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Downtown" required
            style={{ ...fieldInputStyle, borderColor: nameError ? "var(--ember)" : "rgba(22,18,15,0.16)" }}
            onFocus={e => { e.target.style.borderColor = nameError ? "var(--ember)" : "var(--zippy)"; e.target.style.boxShadow = nameError ? "0 0 0 3px rgba(199,42,10,0.12)" : "0 0 0 3px rgba(255,61,20,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = nameError ? "var(--ember)" : "rgba(22,18,15,0.16)"; e.target.style.boxShadow = "none"; }} />
          {nameError && <p style={{ margin: "3px 0 0", fontSize: 10, color: "var(--ember)", fontFamily: "var(--font-mono)" }}>{nameError}</p>}
        </div>

        <div>
          <label style={fieldLabelStyle}>Address</label>
          <div style={{ position: "relative" }}>
            <input value={address} readOnly={Boolean(placeId)}
              onChange={e => { setAddress(e.target.value); setPlaceId(null); setLatitude(null); setLongitude(null); setStreet(null); setNumber(null); setCity(null); setBState(null); setZipCode(null); setComplement(null); setNumberComplement(null); setMapsUrl(""); setAddressError(null); }}
              placeholder="Search address…" required
              style={{ ...fieldInputStyle, paddingRight: placeId ? 36 : 12 }}
              onFocus={e => { if (!placeId) { e.target.style.borderColor = "var(--zippy)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,61,20,0.12)"; } }}
              onBlur={e => { e.target.style.borderColor = addressError ? "var(--ember)" : "rgba(22,18,15,0.16)"; e.target.style.boxShadow = "none"; }} />
            {placeId && (
              <button type="button" onClick={clearAddress} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, borderRadius: 999, border: 0, background: "var(--bone)", color: "var(--slate)", fontSize: 13, lineHeight: 1, display: "grid", placeItems: "center", cursor: "pointer", fontFamily: "var(--font-sans)" }}>×</button>
            )}
            {(searching || suggestions.length > 0) && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, border: "1px solid rgba(22,18,15,0.12)", borderRadius: 8, background: "var(--paper)", boxShadow: "0 4px 16px rgba(22,18,15,0.10)", overflow: "hidden" }}>
                {searching && (
                  <p style={{ margin: 0, padding: "8px 10px", fontSize: 12, color: "var(--slate)", fontFamily: "var(--font-sans)" }}>Searching…</p>
                )}
                {suggestions.map(item => (
                  <button key={item.placeId} type="button" onMouseDown={e => { e.preventDefault(); selectAddress(item); }} style={{ border: 0, borderTop: "1px solid rgba(22,18,15,0.06)", width: "100%", textAlign: "left", background: "transparent", padding: "8px 10px", color: "var(--ink)", fontFamily: "var(--font-sans)", fontSize: 13, cursor: "pointer", display: "block" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--cream)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                    {item.description}
                  </button>
                ))}
              </div>
            )}
          </div>
          {addressError && <p style={{ margin: "3px 0 0", fontSize: 10, color: "var(--ember)", fontFamily: "var(--font-mono)" }}>{addressError}</p>}
        </div>

        <div>
          <label style={fieldLabelStyle}>Operating hours</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {WEEK_DAYS.map(day => {
              const ranges = hours[day];
              const closed = ranges.length === 0;
              return (
                <div key={day}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: closed ? 0 : 4 }}>
                    <span className="mono" style={{ width: 28, fontSize: 10, fontWeight: 600, color: closed ? "var(--slate)" : "var(--ink)", letterSpacing: "0.06em", flexShrink: 0 }}>{WEEK_DAY_LABELS[day]}</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input type="checkbox" checked={closed} onChange={e => setDayClosed(day, e.target.checked)} style={{ accentColor: "var(--ink)", width: 12, height: 12 }} />
                      <span style={{ fontSize: 10.5, color: "var(--slate)", fontFamily: "var(--font-sans)" }}>Closed</span>
                    </label>
                  </div>
                  {!closed && (
                    <div style={{ marginLeft: 36, display: "flex", flexDirection: "column", gap: 4 }}>
                      {ranges.map((range, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <TimeInput size="sm" value={timeStringToValue(range.start)} onChange={v => setDayRangeValue(day, i, "start", valueToTimeString(v))} />
                          <span style={{ color: "var(--slate)", fontSize: 12, userSelect: "none" }}>—</span>
                          <TimeInput size="sm" value={timeStringToValue(range.end)} onChange={v => setDayRangeValue(day, i, "end", valueToTimeString(v))} />
                          {ranges.length > 1 && (
                            <button type="button" onClick={() => removeDayRange(day, i)} style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 999, border: 0, background: "rgba(22,18,15,0.08)", color: "var(--slate)", fontSize: 13, lineHeight: 1, display: "grid", placeItems: "center", cursor: "pointer" }}>×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addDayRange(day)} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontSize: 11, color: "var(--zippy)", fontFamily: "var(--font-sans)", fontWeight: 500, cursor: "pointer" }}>+ Add span</button>
                      {hoursErrors[day] && <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--ember)", fontFamily: "var(--font-mono)" }}>{hoursErrors[day]}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            style={{ background: "none", border: "1px solid rgba(199,42,10,0.28)", borderRadius: 7, padding: "6px 12px", color: deleting ? "var(--slate)" : "#d43a2c", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, cursor: deleting ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {!deleting && (
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 9l6 6M15 9l-6 6" />
              </svg>
            )}
            {deleting ? "Deleting…" : "Delete branch"}
          </button>
        </div>
      </div>}

    </div>
  );
});

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingSetupForm({
  initialStatus,
  initialError = null,
  initialStripeReturned = false,
  initialStripeMessage = null,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  // 3 steps: 0=business, 1=branches, 2=banking
  const [currentStep, setCurrentStep] = useState(() => {
    if (!initialStatus.checklist.basicInfoComplete) return 0;
    if (!initialStatus.checklist.branchesComplete) return 1;
    return 2;
  });

  // Business info state
  const [name, setName] = useState(initialStatus.basicInfo.name);
  const [logoUrl, setLogoUrl] = useState(initialStatus.basicInfo.logoUrl ?? "");

  // Per-branch error indicator state (id/tempId → hasErrors)
  const [branchErrors, setBranchErrors] = useState<Record<string, boolean>>({});

  // Pending (unsaved) new branches created locally before Continue
  const pendingBranchRefs = useRef<Record<string, BranchCardHandle | null>>({});
  const [pendingBranches, setPendingBranches] = useState<string[]>([]);
  const [pendingNames, setPendingNames] = useState<Record<string, string>>({});
  const pendingCounter = useRef(0);

  // Which branch is shown in the right detail panel
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    () => initialStatus.branches[0]?.id ?? ""
  );

  // Loading / feedback
  const [savingBasics, setSavingBasics] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError ?? initialStripeMessage);
  const [messageType, setMessageType] = useState<"error" | "success" | null>(
    initialError ? "error" : initialStripeMessage ? "success" : null,
  );

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const branchCardRefs = useRef<Record<string, BranchCardHandle | null>>({});

  const stepDone = useMemo(
    () => [
      status.checklist.basicInfoComplete,
      status.checklist.branchesComplete,
      status.checklist.stripeReady,
    ],
    [status.checklist],
  );

  const completedCount = stepDone.filter(Boolean).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function onLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    setUploadingLogo(true);
    setMessage(null);
    setMessageType(null);
    try {
      const res = await fetch("/api/bucket/upload", { method: "POST", body: formData });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || typeof payload.url !== "string") {
        setMessage(payload.error ?? "Could not upload image.");
        setMessageType("error");
        return;
      }
      setLogoUrl(payload.url);
      setMessage("Image uploaded.");
      setMessageType("success");
    } catch {
      setMessage("Could not upload image.");
      setMessageType("error");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function saveBasicInfo(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingBasics) return;
    setSavingBasics(true);
    setMessage(null); setMessageType(null);
    try {
      const hasBusiness = Boolean(status.basicInfo.businessId);
      const res = await fetch(
        hasBusiness ? "/api/businesses/current/onboarding" : "/api/businesses",
        { method: hasBusiness ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, logoUrl: logoUrl.trim() }) },
      );
      const payload = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        const reason = isRecord(payload) && typeof payload.error === "string" ? payload.error : "Could not save business info.";
        setMessage(reason); setMessageType("error"); return;
      }
      if (!isRecord(payload)) { setMessage("Could not save business info."); setMessageType("error"); return; }
      const nextName = typeof payload.name === "string" ? payload.name : name;
      const nextLogo = typeof payload.logoUrl === "string" ? payload.logoUrl : logoUrl;
      const nextBusinessId = typeof payload.businessId === "string" ? payload.businessId : status.basicInfo.businessId;
      const nextOrderLinkUrl = typeof payload.orderLinkUrl === "string" ? payload.orderLinkUrl : status.basicInfo.orderLinkUrl;
      const basicInfoComplete = Boolean(nextName && nextLogo);
      setName(nextName); setLogoUrl(nextLogo ?? "");
      setStatus((cur) => ({ ...cur, basicInfo: { ...cur.basicInfo, businessId: nextBusinessId, name: nextName, logoUrl: nextLogo || null, orderLinkUrl: nextOrderLinkUrl }, checklist: { ...cur.checklist, basicInfoComplete, completed: basicInfoComplete && cur.checklist.branchesComplete && cur.checklist.stripeReady } }));
      if (!hasBusiness && nextBusinessId) setSelectedBusinessIdSession(nextBusinessId);
      setMessage("Restaurant profile saved."); setMessageType("success");
      setCurrentStep((s) => (s === 0 ? 1 : s));
    } catch { setMessage("Could not save business info."); setMessageType("error"); }
    finally { setSavingBasics(false); }
  }

  async function deleteBranch(branchId: string) {
    setDeletingBranchId(branchId); setMessage(null); setMessageType(null);
    try {
      const res = await fetch(`/api/businesses/current/onboarding/branches/${encodeURIComponent(branchId)}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) { setMessage("Could not remove branch."); setMessageType("error"); return; }
      setStatus((cur) => {
        const next = cur.branches.filter((b) => b.id !== branchId);
        const branchesComplete = next.length > 0;
        return { ...cur, branches: next, checklist: { ...cur.checklist, branchesComplete, completed: cur.checklist.basicInfoComplete && branchesComplete && cur.checklist.stripeReady } };
      });
      setMessage("Branch removed."); setMessageType("success");
    } catch { setMessage("Could not remove branch."); setMessageType("error"); }
    finally { setDeletingBranchId(null); }
  }

  async function handleBranchUpdate(payload: BranchUpdatePayload) {
    setMessage(null); setMessageType(null);
    const res = await fetch(`/api/businesses/current/onboarding/branches/${encodeURIComponent(payload.branchId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: payload.name, addressDescription: payload.address, mapboxPlaceId: payload.placeId, mapboxLatitude: payload.latitude, mapboxLongitude: payload.longitude, addressStreet: payload.street, addressNumber: payload.number, addressCity: payload.city, addressState: payload.state, addressZipCode: payload.zipCode, addressComplement: payload.complement, addressNumberComplement: payload.numberComplement, addressGoogleMapsUrl: payload.mapsUrl, operationHours: payload.operationHours }),
    });
    const data = (await res.json().catch(() => ({}))) as unknown;
    if (!res.ok || !isRecord(data)) { setMessage("Could not update branch."); setMessageType("error"); throw new Error("update failed"); }
    const updated: OnboardingBranch = {
      id: payload.branchId,
      name: typeof data.name === "string" ? data.name : payload.name,
      addressDescription: typeof data.addressDescription === "string" ? data.addressDescription : payload.address,
      addressGoogleMapsUrl: typeof data.addressGoogleMapsUrl === "string" ? data.addressGoogleMapsUrl : payload.mapsUrl,
      addressLatitude: typeof data.addressLatitude === "number" ? data.addressLatitude : payload.latitude,
      addressLongitude: typeof data.addressLongitude === "number" ? data.addressLongitude : payload.longitude,
      addressStreet: typeof data.addressStreet === "string" ? data.addressStreet : payload.street,
      addressNumber: typeof data.addressNumber === "string" ? data.addressNumber : payload.number,
      addressCity: typeof data.addressCity === "string" ? data.addressCity : payload.city,
      addressState: typeof data.addressState === "string" ? data.addressState : payload.state,
      addressZipCode: typeof data.addressZipCode === "string" ? data.addressZipCode : payload.zipCode,
      addressComplement: typeof data.addressComplement === "string" ? data.addressComplement : payload.complement,
      addressNumberComplement: typeof data.addressNumberComplement === "string" ? data.addressNumberComplement : payload.numberComplement,
      addressPlaceId: typeof data.addressPlaceId === "string" ? data.addressPlaceId : payload.placeId,
      createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
      operationHours: data.operationHours ?? payload.operationHours,
    };
    setStatus((cur) => ({ ...cur, branches: cur.branches.map((b) => (b.id === payload.branchId ? updated : b)) }));
    setMessage("Branch updated."); setMessageType("success");
  }

  async function handleContinueBranches() {
    if (savingBranch) return;
    let allValid = true;
    for (const branch of status.branches) {
      const handle = branchCardRefs.current[branch.id];
      if (handle && !handle.validateAndShowErrors()) allValid = false;
    }
    for (const tempId of pendingBranches) {
      const handle = pendingBranchRefs.current[tempId];
      if (handle && !handle.validateAndShowErrors()) allValid = false;
    }
    if (!allValid) return;
    setSavingBranch(true); setMessage(null); setMessageType(null);
    try {
      const payloads = status.branches
        .map((b) => branchCardRefs.current[b.id]?.getPayload())
        .filter((p): p is BranchUpdatePayload => p !== null);
      await Promise.all(payloads.map((p) => handleBranchUpdate(p)));

      const newlyCreated: OnboardingBranch[] = [];
      for (const tempId of pendingBranches) {
        const handle = pendingBranchRefs.current[tempId];
        const payload = handle?.hasData() ? handle.getPayload() : null;
        if (!payload) continue;
        const res = await fetch("/api/businesses/current/branches", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: payload.name, addressDescription: payload.address, mapboxPlaceId: payload.placeId, mapboxLatitude: payload.latitude, mapboxLongitude: payload.longitude, addressStreet: payload.street, addressNumber: payload.number, addressCity: payload.city, addressState: payload.state, addressZipCode: payload.zipCode, addressComplement: payload.complement, addressNumberComplement: payload.numberComplement, addressGoogleMapsUrl: payload.mapsUrl, operationHours: payload.operationHours }),
        });
        const data = (await res.json().catch(() => ({}))) as unknown;
        if (!res.ok || !isRecord(data)) { setMessage("Could not save branch."); setMessageType("error"); return; }
        newlyCreated.push({
          id: typeof data.id === "string" ? data.id : "",
          name: typeof data.name === "string" ? data.name : payload.name,
          addressDescription: typeof data.addressDescription === "string" ? data.addressDescription : payload.address,
          addressGoogleMapsUrl: typeof data.addressGoogleMapsUrl === "string" ? data.addressGoogleMapsUrl : payload.mapsUrl,
          addressLatitude: typeof data.addressLatitude === "number" ? data.addressLatitude : payload.latitude,
          addressLongitude: typeof data.addressLongitude === "number" ? data.addressLongitude : payload.longitude,
          addressStreet: typeof data.addressStreet === "string" ? data.addressStreet : payload.street,
          addressNumber: typeof data.addressNumber === "string" ? data.addressNumber : payload.number,
          addressCity: typeof data.addressCity === "string" ? data.addressCity : payload.city,
          addressState: typeof data.addressState === "string" ? data.addressState : payload.state,
          addressZipCode: typeof data.addressZipCode === "string" ? data.addressZipCode : payload.zipCode,
          addressComplement: typeof data.addressComplement === "string" ? data.addressComplement : payload.complement,
          addressNumberComplement: typeof data.addressNumberComplement === "string" ? data.addressNumberComplement : payload.numberComplement,
          addressPlaceId: typeof data.addressPlaceId === "string" ? data.addressPlaceId : payload.placeId,
          createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
          operationHours: data.operationHours ?? payload.operationHours,
        });
      }
      if (newlyCreated.length > 0) {
        setStatus((cur) => ({ ...cur, branches: [...cur.branches, ...newlyCreated], checklist: { ...cur.checklist, branchesComplete: true, completed: cur.checklist.basicInfoComplete && cur.checklist.stripeReady } }));
        setPendingBranches([]);
        setPendingNames({});
      }
      setCurrentStep(2);
    } catch { setMessage("Could not save branches."); setMessageType("error"); }
    finally { setSavingBranch(false); }
  }

  async function refreshStripeStatus(opts?: { fromStripeReturn?: boolean }) {
    setLoadingStripe(true);
    if (!opts?.fromStripeReturn) { setMessage(null); setMessageType(null); }
    try {
      const res = await fetch("/api/integrations/stripe/connect/status", { cache: "no-store" });
      const payload = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok || !isRecord(payload)) { setMessage("Could not refresh Stripe status."); setMessageType("error"); return; }
      const stripeReady = Boolean(payload.readyForPayouts);
      setStatus((cur) => ({ ...cur, stripe: { accountId: typeof payload.accountId === "string" && payload.accountId.trim() ? payload.accountId : null, detailsSubmitted: Boolean(payload.detailsSubmitted), chargesEnabled: Boolean(payload.chargesEnabled), payoutsEnabled: Boolean(payload.payoutsEnabled), readyForPayouts: stripeReady }, checklist: { ...cur.checklist, stripeReady, completed: cur.checklist.basicInfoComplete && cur.checklist.branchesComplete && stripeReady } }));
      if (stripeReady) { setMessage(opts?.fromStripeReturn ? "Stripe setup completed successfully." : "Stripe status updated."); setMessageType("success"); }
      else if (opts?.fromStripeReturn) { setMessage("Stripe setup is still pending. Please continue onboarding on Stripe."); setMessageType("error"); }
      else { setMessage("Stripe status updated."); setMessageType("success"); }
    } catch { setMessage("Could not refresh Stripe status."); setMessageType("error"); }
    finally { setLoadingStripe(false); }
  }

  useEffect(() => {
    if (!initialStripeReturned) return;
    void refreshStripeStatus({ fromStripeReturn: true });
  }, [initialStripeReturned]);

  // ── Step content panels (rendered inline in active step body) ──────────────

  function StepBodyRestaurant() {
    return (
      <form id="form-step-0" onSubmit={saveBasicInfo} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={fieldLabelStyle}>Restaurant name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Osteria Fiamma"
            required
            style={fieldInputStyle}
            onFocus={(e) => { e.target.style.borderColor = "var(--zippy)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,61,20,0.12)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(22,18,15,0.16)"; e.target.style.boxShadow = "none"; }}
          />
          <p style={fieldHintStyle}>Used on receipts and driver displays.</p>
        </div>
        <div>
          <label style={fieldLabelStyle}>Business logo</label>
          {logoUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1.5px solid #00a866", borderRadius: 9, background: "rgba(0,168,102,0.05)" }}>
              <img src={logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 7, objectFit: "cover", border: "1px solid rgba(22,18,15,0.1)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{logoUrl.split("/").pop()}</div>
                <div style={{ fontSize: 11, color: "#00a866", marginTop: 1 }}>✓ Uploaded</div>
              </div>
              <button type="button" onClick={() => setLogoUrl("")} style={{ background: "none", border: "1px solid rgba(22,18,15,0.12)", borderRadius: 6, padding: "5px 10px", fontSize: 11, color: "var(--slate)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                Remove
              </button>
            </div>
          ) : (
            <div
              style={{ border: "1.5px dashed rgba(22,18,15,0.2)", borderRadius: 9, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "rgba(22,18,15,0.02)", cursor: "pointer" }}
              onClick={() => logoInputRef.current?.click()}
            >
              <div style={{ fontSize: 12.5, color: "var(--slate)", textAlign: "center" }}>
                Drop logo here or <span style={{ color: "var(--zippy)", fontWeight: 600, textDecoration: "underline" }}>browse</span>
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--slate)", letterSpacing: "0.1em" }}>PNG · JPG · UP TO 2 MB</div>
            </div>
          )}
          <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) void uploadImage(f); e.currentTarget.value = ""; }} />
          {uploadingLogo && <p style={fieldHintStyle}>Uploading…</p>}
        </div>
      </form>
    );
  }

  function StepBodyBranches() {
    const totalSaved = status.branches.length;

    function addBranch() {
      const tempId = `__pending_${++pendingCounter.current}`;
      setPendingBranches(prev => [...prev, tempId]);
      setSelectedBranchId(tempId);
    }

    function removePending(tempId: string) {
      const next = pendingBranches.filter(id => id !== tempId);
      setPendingBranches(next);
      setPendingNames(prev => { const n = { ...prev }; delete n[tempId]; return n; });
      delete pendingBranchRefs.current[tempId];
      if (selectedBranchId === tempId) {
        setSelectedBranchId(next[0] ?? status.branches[status.branches.length - 1]?.id ?? "");
      }
    }

    return (
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* Left: selector list */}
        <div style={{ width: 168, flexShrink: 0, border: "1px solid rgba(22,18,15,0.1)", borderRadius: 10, background: "var(--paper)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {status.branches.map((branch, idx) => (
            <button
              key={branch.id}
              type="button"
              onClick={() => setSelectedBranchId(branch.id)}
              style={{
                width: "100%", textAlign: "left", border: "none",
                borderBottom: "1px solid rgba(22,18,15,0.08)",
                padding: "10px 12px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: selectedBranchId === branch.id ? "var(--cream)" : "transparent",
                fontFamily: "var(--font-sans)", fontSize: 13,
                fontWeight: selectedBranchId === branch.id ? 600 : 400,
                color: selectedBranchId === branch.id ? "var(--ink)" : "var(--slate)",
                cursor: "pointer",
              }}
            >
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{branch.name || `Branch ${idx + 1}`}</span>
              {branchErrors[branch.id] && <IconTriangleAlert size={12} color="var(--ember)" style={{ flexShrink: 0, marginLeft: 4 }} />}
            </button>
          ))}
          {pendingBranches.map((tempId, i) => (
            <button
              key={tempId}
              type="button"
              onClick={() => setSelectedBranchId(tempId)}
              style={{
                width: "100%", textAlign: "left", border: "none",
                borderBottom: "1px solid rgba(22,18,15,0.08)",
                padding: "10px 12px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: selectedBranchId === tempId ? "var(--cream)" : "transparent",
                fontFamily: "var(--font-sans)", fontSize: 13,
                fontWeight: selectedBranchId === tempId ? 600 : 400,
                color: selectedBranchId === tempId ? "var(--ink)" : "var(--slate)",
                cursor: "pointer",
              }}
            >
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingNames[tempId] || `Branch ${totalSaved + i + 1}`}</span>
              {branchErrors[tempId] && <IconTriangleAlert size={12} color="var(--ember)" style={{ flexShrink: 0, marginLeft: 4 }} />}
            </button>
          ))}
          <button
            type="button"
            onClick={addBranch}
            style={{
              width: "100%", textAlign: "left", border: "none",
              padding: "10px 12px",
              background: "transparent",
              fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
              color: "var(--zippy)", cursor: "pointer",
            }}
          >
            + Add branch
          </button>
        </div>

        {/* Right: detail form — all cards stay mounted, only selected visible */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedBranchId === "" ? (
            <p style={{ fontSize: 13, color: "var(--slate)", margin: 0 }}>Click "+ Add branch" to get started.</p>
          ) : (
            <>
              {status.branches.map((branch, idx) => (
                <div key={branch.id} style={{ display: selectedBranchId === branch.id ? "block" : "none" }}>
                  <BranchCardForm
                    ref={(el) => { branchCardRefs.current[branch.id] = el; }}
                    branch={branch}
                    idx={idx}
                    onDelete={() => {
                      const remaining = status.branches.filter(b => b.id !== branch.id);
                      setSelectedBranchId(remaining[0]?.id ?? pendingBranches[0] ?? "");
                      void deleteBranch(branch.id);
                    }}
                    deleting={deletingBranchId === branch.id}
                    onErrorsChange={(hasErrors) => setBranchErrors(prev => ({ ...prev, [branch.id]: hasErrors }))}
                  />
                </div>
              ))}
              {pendingBranches.map((tempId, i) => (
                <div key={tempId} style={{ display: selectedBranchId === tempId ? "block" : "none" }}>
                  <BranchCardForm
                    ref={(el) => { pendingBranchRefs.current[tempId] = el; }}
                    branch={{ ...EMPTY_BRANCH, id: tempId }}
                    idx={totalSaved + i}
                    onDelete={() => removePending(tempId)}
                    deleting={false}
                    onNameChange={(n) => setPendingNames(prev => ({ ...prev, [tempId]: n }))}
                    onErrorsChange={(hasErrors) => setBranchErrors(prev => ({ ...prev, [tempId]: hasErrors }))}
                  />
                </div>
              ))}
            </>
          )}
        </div>

      </div>
    );
  }

  function StepBodyLaunch() {
    const stripeStatus = status.stripe.readyForPayouts ? "connected" : status.stripe.detailsSubmitted ? "pending" : "not-started";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Stripe explainer */}
        <div style={{ background: "#f3f8ff", border: "1px solid rgba(26,118,188,0.2)", borderRadius: 9, padding: "14px 14px" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5, color: "#1a76bc", marginBottom: 5 }}>Payments powered by Stripe</div>
          <div style={{ fontSize: 12, color: "#0d4a8f", lineHeight: 1.5 }}>Zippy uses Stripe Connect to handle payments. Funds go directly to your bank — we never hold your money.</div>
        </div>

        {/* Stripe status */}
        <div style={{ borderRadius: 9, padding: "12px 14px", border: "1px solid", background: stripeStatus === "connected" ? "#e6f7ee" : stripeStatus === "pending" ? "#fffef0" : "#fef3f1", borderColor: stripeStatus === "connected" ? "#00a866" : stripeStatus === "pending" ? "#d4a574" : "#d43a2c" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: stripeStatus === "connected" ? "#00a866" : stripeStatus === "pending" ? "#d4a574" : "#d43a2c" }} />
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5, color: stripeStatus === "connected" ? "#00633e" : stripeStatus === "pending" ? "#7a5a2b" : "#731a15" }}>
              {stripeStatus === "connected" ? "Stripe connected" : stripeStatus === "pending" ? "Pending setup" : "Not connected"}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: stripeStatus === "connected" ? "#004a2e" : stripeStatus === "pending" ? "#6b5229" : "#7a3530" }}>
            {stripeStatus === "connected" ? "Your account is fully verified. Payouts every 2 business days." : stripeStatus === "pending" ? "Continue Stripe onboarding to complete verification." : "Click below to start the Stripe onboarding flow."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 7 }}>
          <Button variant="primary" size="sm" onClick={() => { window.location.href = "/api/integrations/stripe/connect"; }}>
            {status.stripe.accountId ? "Continue Stripe setup" : "Connect Stripe"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => void refreshStripeStatus()} disabled={loadingStripe}>
            {loadingStripe ? "Checking…" : "Refresh status"}
          </Button>
        </div>

        {/* Order link */}
        {status.basicInfo.orderLinkUrl && (
          <div style={{ paddingTop: 10, borderTop: "1px solid rgba(22,18,15,0.08)" }}>
            <label style={fieldLabelStyle}>Your ordering link</label>
            <input readOnly value={status.basicInfo.orderLinkUrl} style={{ ...fieldInputStyle, fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--cream)", color: "var(--ink)", marginBottom: 8 }} />
            <Button variant="primary" size="sm" style={{ background: "#00a866" }} onClick={() => window.open(status.basicInfo.orderLinkUrl, "_blank")}>
              Open preview →
            </Button>
          </div>
        )}

        {/* Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 10, borderTop: "1px solid rgba(22,18,15,0.08)" }}>
          {[
            ["Restaurant profile", status.checklist.basicInfoComplete],
            ["Delivery zones", status.checklist.branchesComplete],
            ["Stripe payments", status.checklist.stripeReady],
          ].map(([label, done]) => (
            <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: done ? "var(--ink)" : "var(--slate)" }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: done ? "#00a866" : "rgba(22,18,15,0.08)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                {done && <IconCheck size={10} color="#fff" strokeWidth={2.5} />}
              </div>
              <span style={{ fontWeight: done ? 600 : 400 }}>{label as string}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stepBodyMap = [StepBodyRestaurant, StepBodyBranches, StepBodyLaunch] as const;
  const ActiveStepBody = stepBodyMap[currentStep] ?? StepBodyRestaurant;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        height: "100dvh",
        background: "var(--paper)",
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "min(100%, 880px)",
          display: 'flex',
          flexDirection: 'row',
          // gap: 24,
          flex: 1,
          alignItems: "stretch",
        }}
      >
        {/* ── LEFT: stepper card ──────────────────────────────────────────── */}
        <div
          style={{
            width: 350,
            flexShrink: 0,
            padding: "24px 24px 28px",
            borderRight: "1px solid rgba(22,18,15,0.08)",
            background: "var(--cream)",
            overflow: "hidden",
          }}
        >
          {/* Logo + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <MarkPulse size={26} />
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}
            >
              Set up Zippy
            </div>
            <div style={{ marginLeft: "auto" }}>
              <button
                type="button"
                onClick={onLogout}
                style={{
                  border: 0, background: "none", padding: 0,
                  fontFamily: "var(--font-sans)", fontSize: 11,
                  color: "var(--slate)", cursor: "pointer",
                }}
              >
                Log out
              </button>
            </div>
          </div>

          {/* Feedback */}
          {/* {message ? (
            <div
              style={{
                marginBottom: 14,
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                background: messageType === "error" ? "rgba(199,42,10,0.07)" : "rgba(0,168,102,0.07)",
                color: messageType === "error" ? "var(--ember)" : "#00633e",
                border: `1px solid ${messageType === "error" ? "rgba(199,42,10,0.2)" : "rgba(0,168,102,0.2)"}`,
              }}
            >
              {message}
            </div>
          ) : null} */}

          {/* Vertical stepper */}
          <OnboardingStepper
            steps={STEPS}
            stepDone={stepDone}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
        </div>

        {/* ── RIGHT: step content ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Step header */}
          <div style={{
            borderBottom: "1px solid rgba(22,18,15,0.08)",
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
          }}>
            <div>
              <div
                className="mono uppercase"
                style={{ fontSize: 10, color: "var(--slate)", letterSpacing: "0.14em", marginBottom: 6 }}
              >
                Step {currentStep + 1} of {STEPS.length}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.025em", color: "var(--ink)", lineHeight: 1.1 }}>
                {STEPS[currentStep].label}
              </div>
            </div>
            <div style={{ height: 6, width: 140, borderRadius: 999, background: "rgba(22,18,15,0.08)", overflow: "hidden", flexShrink: 0, marginTop: 8 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--zippy)", borderRadius: 999, transition: "width 0.3s ease" }} />
            </div>
          </div>

          {/* Active step body */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <div className="py-6 px-8 max-w-175">
              {ActiveStepBody()}
            </div>
          </div>

          {/* Continue / Back */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 32px",
            borderTop: "1px solid rgba(22,18,15,0.08)",
            background: "var(--cream)",
          }}>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>

            <div className="mono" style={{ fontSize: 10, color: "var(--slate)", letterSpacing: "0.1em" }}>
              Step {currentStep + 1} of {STEPS.length}
            </div>

            <Button
              type={currentStep === 0 ? "submit" : "button"}
              form={currentStep === 0 ? "form-step-0" : undefined}
              variant="primary"
              size="md"
              onClick={
                currentStep === 1
                  ? () => void handleContinueBranches()
                  : currentStep === STEPS.length - 1
                    ? () => router.replace("/")
                    : currentStep !== 0
                      ? () => setCurrentStep(Math.min(currentStep + 1, STEPS.length - 1))
                      : undefined
              }
              disabled={
                (currentStep === 0 && savingBasics) ||
                (currentStep === 1 && savingBranch) ||
                (currentStep === 1 && status.branches.length === 0 && pendingBranches.length === 0)
              }
              style={{
                background: currentStep === STEPS.length - 1 ? "#00a866" : "var(--zippy)",
                opacity: (currentStep === 1 && status.branches.length === 0 && pendingBranches.length === 0) ? 0.45 : 1,
                cursor: (currentStep === 1 && status.branches.length === 0 && pendingBranches.length === 0) ? "not-allowed" : "pointer",
              }}
            >
              {currentStep === 0 && savingBasics
                ? "Saving…"
                : currentStep === STEPS.length - 1
                  ? "Launch Zippy"
                  : "Continue →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

