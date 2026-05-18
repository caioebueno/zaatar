"use client";

import { useEffect, useRef, useState } from "react";

// ── Tokens ────────────────────────────────────────────────────────────────────
export const D = {
  bg: "#050403",
  bg2: "#0a0807",
  surf: "#181310",
  surf2: "#1e1812",
  surf3: "#2a211b",
  line: "rgba(250,245,238,0.08)",
  lineA: "rgba(250,245,238,0.14)",
  text: "#faf5ee",
  dim: "rgba(250,245,238,0.55)",
  faint: "rgba(250,245,238,0.28)",
  mute: "rgba(250,245,238,0.10)",
  zippy: "#ff3d14",
  green: "#34d399",
  mono: "var(--font-geist-mono, 'Geist Mono', monospace)",
};

// ── Zippy mark ────────────────────────────────────────────────────────────────
export function ZippyMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", flexShrink: 0 }}>
      <rect width="100" height="100" rx="22" fill={D.zippy} />
      <rect x="41" y="51" width="18" height="18" rx="4" fill="#fff" />
      <path d="M28 60 A22 22 0 0 1 72 60" stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.55" />
      <path d="M18 60 A32 32 0 0 1 82 60" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.25" />
    </svg>
  );
}

// ── Wordmark ──────────────────────────────────────────────────────────────────
export function Wordmark({ size = 26, color = D.text }: { size?: number; color?: string }) {
  return (
    <span style={{ fontFamily: "Geist, var(--font-geist)", fontWeight: 800, fontSize: size, letterSpacing: "-0.05em", color, lineHeight: 1 }}>
      Z
      <span style={{ position: "relative", display: "inline-block" }}>
        ı
        <span style={{
          position: "absolute", left: "50%", top: "0.36em",
          width: "0.14em", height: "0.14em", background: D.zippy,
          transform: "translateX(-50%)", borderRadius: "1px", display: "block",
        }} />
      </span>
      ppy
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: "auth-spin 0.72s linear infinite", display: "block", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
      <path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────
export function AuthBtn({
  label, onClick, loading, disabled,
}: {
  label: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const active = !disabled && !loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!active}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", height: 52, borderRadius: 12, border: "none",
        background: active ? D.zippy : D.surf3,
        color: active ? "#fff" : D.faint,
        fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.015em",
        cursor: active ? "pointer" : "default",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "background 200ms, box-shadow 200ms, transform 150ms",
        boxShadow: active && hov ? `0 8px 32px ${D.zippy}50` : active ? `0 4px 20px ${D.zippy}35` : "none",
        opacity: hov && active ? 0.92 : 1,
        transform: hov && active ? "scale(0.987)" : "scale(1)",
        fontFamily: "inherit",
      }}>
      {loading ? <Spinner /> : label}
    </button>
  );
}

// ── Ghost/link button ─────────────────────────────────────────────────────────
export function AuthLinkBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: hov ? D.zippy : D.dim,
        fontSize: 13.5, fontWeight: 600,
        transition: "color 150ms", fontFamily: "inherit", padding: 0,
      }}>
      {children}
    </button>
  );
}

// ── Text input ────────────────────────────────────────────────────────────────
export function AuthTextInput({
  label, value, onChange, placeholder, error, autoFocus, type = "text",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  const border = error ? "#ff5577" : focused ? D.zippy : D.lineA;
  const shadow = error ? "0 0 0 3px rgba(255,85,119,0.13)" : focused ? `0 0 0 3px ${D.zippy}1f` : "none";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: D.dim, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: D.mono }}>
          {label}
        </label>
      )}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        type={type}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", height: 52, borderRadius: 12, border: `1px solid ${border}`,
          background: focused ? "rgba(250,245,238,0.06)" : "rgba(250,245,238,0.035)",
          color: D.text, fontSize: 15, fontFamily: "inherit", fontWeight: 500,
          padding: "0 16px", outline: "none", boxShadow: shadow,
          transition: "border-color 150ms, box-shadow 150ms, background 150ms",
          letterSpacing: "-0.01em",
        }}
      />
      {error && <span style={{ fontSize: 11, color: "#ff6688", fontFamily: D.mono, letterSpacing: "0.06em" }}>⚠ {error}</span>}
    </div>
  );
}

// ── Phone input with country selector ─────────────────────────────────────────
const COUNTRIES = [
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
];

export function PhoneInput({
  value, onChange, error, countryCode, onCountryChange,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  countryCode: string;
  onCountryChange: (code: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0];

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const border = error ? "#ff5577" : focused || open ? D.zippy : D.lineA;
  const shadow = error ? "0 0 0 3px rgba(255,85,119,0.13)" : (focused || open) ? `0 0 0 3px ${D.zippy}1f` : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: D.dim, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: D.mono }}>
        Phone number
      </label>
      <div ref={ref} style={{ position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center", height: 52, borderRadius: 12,
          border: `1px solid ${border}`,
          background: (focused || open) ? "rgba(250,245,238,0.06)" : "rgba(250,245,238,0.035)",
          boxShadow: shadow,
          transition: "border-color 150ms, box-shadow 150ms, background 150ms",
        }}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "0 12px 0 14px",
              height: "100%", background: "none", border: "none", cursor: "pointer",
              borderRight: `1px solid ${D.line}`, flexShrink: 0,
            }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{selectedCountry.flag}</span>
            <span style={{ fontFamily: D.mono, fontSize: 12.5, color: D.dim, fontWeight: 600, letterSpacing: "0.02em" }}>
              {selectedCountry.code}
            </span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={D.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 150ms", transform: open ? "rotate(180deg)" : "none" }}>
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
          <input
            type="tel"
            value={value}
            onChange={e => onChange(fmt(e.target.value))}
            placeholder="(555) 000-0000"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1, height: "100%", border: "none", outline: "none", background: "transparent",
              color: D.text, fontSize: 15, fontFamily: D.mono, fontWeight: 500,
              padding: "0 14px", letterSpacing: "0.04em",
            }}
          />
        </div>
        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 60,
            background: D.surf, borderRadius: 12, border: `1px solid ${D.lineA}`,
            boxShadow: "0 20px 50px rgba(0,0,0,0.65)", overflow: "hidden", minWidth: 220,
            animation: "auth-in 140ms ease",
          }}>
            {COUNTRIES.map((c, i) => (
              <div
                key={i}
                onMouseDown={() => { onCountryChange(c.code); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                  cursor: "pointer", transition: "background 80ms",
                  background: selectedCountry.name === c.name ? D.surf2 : "transparent",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = D.surf2)}
                onMouseLeave={e => (e.currentTarget.style.background = selectedCountry.name === c.name ? D.surf2 : "transparent")}
              >
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span style={{ fontFamily: "inherit", fontSize: 13.5, color: D.text, fontWeight: 500, flex: 1 }}>{c.name}</span>
                <span style={{ fontFamily: D.mono, fontSize: 12, color: D.dim }}>{c.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <span style={{ fontSize: 11, color: "#ff6688", fontFamily: D.mono, letterSpacing: "0.06em" }}>⚠ {error}</span>}
    </div>
  );
}

// ── OTP digit row ─────────────────────────────────────────────────────────────
export function OTPDigits({
  length = 6, onComplete, hasError, resetKey,
}: {
  length?: number;
  onComplete: (code: string) => void;
  hasError?: boolean;
  resetKey?: number;
}) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setDigits(Array(length).fill(""));
    refs.current[0]?.focus();
  }, [resetKey, length]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        const n = [...digits]; n[i - 1] = ""; setDigits(n); refs.current[i - 1]?.focus();
      } else {
        const n = [...digits]; n[i] = ""; setDigits(n);
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    if (!d) return;
    const n = [...digits]; n[i] = d; setDigits(n);
    if (i < length - 1) refs.current[i + 1]?.focus();
    if (n.every(x => x) && onComplete) onComplete(n.join(""));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const n = Array(length).fill("").map((_, i) => raw[i] || "");
    setDigits(n);
    refs.current[Math.min(raw.length, length - 1)]?.focus();
    if (raw.length >= length && onComplete) onComplete(n.join(""));
  };

  return (
    <div style={{ display: "flex", gap: 9, justifyContent: "center" }} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          value={d}
          maxLength={1}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          autoFocus={i === 0}
          style={{
            width: 50, height: 62, textAlign: "center", borderRadius: 14,
            border: `1.5px solid ${hasError ? "#ff5577" : d ? D.zippy : D.lineA}`,
            background: d ? `${D.zippy}12` : "rgba(250,245,238,0.03)",
            color: D.text, fontSize: 26, fontFamily: D.mono, fontWeight: 700,
            outline: "none", caretColor: D.zippy,
            transition: "border-color 150ms, background 150ms, box-shadow 150ms",
          }}
          onFocus={e => {
            e.target.style.boxShadow = `0 0 0 3px ${D.zippy}22`;
            e.target.style.borderColor = D.zippy;
          }}
          onBlur={e => {
            e.target.style.boxShadow = "none";
            e.target.style.borderColor = hasError ? "#ff5577" : d ? D.zippy : D.lineA;
          }}
        />
      ))}
    </div>
  );
}

// ── Kicker label ──────────────────────────────────────────────────────────────
export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: D.mono, fontSize: 10.5, color: D.zippy, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10 }}>
      {children}
    </div>
  );
}

// ── Left brand panel ──────────────────────────────────────────────────────────
export function LeftPanel() {
  return (
    <div style={{
      width: "42%", height: "100%", position: "relative", flexShrink: 0,
      background: D.bg2, borderRight: `1px solid ${D.line}`, overflow: "hidden",
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 50% 46%, rgba(255,61,20,0.08) 0%, transparent 68%),
        radial-gradient(circle, rgba(250,245,238,0.05) 1px, transparent 1px)
      `,
      backgroundSize: "100% 100%, 28px 28px",
    }}>
      {/* Scan line */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,61,20,0.22) 50%, transparent 100%)",
          animation: "auth-scan 4s linear infinite",
        }} />
      </div>

      {/* Top logo */}
      <div style={{ position: "absolute", top: 36, left: 40, display: "flex", alignItems: "center", gap: 12, zIndex: 2 }}>
        <ZippyMark size={30} />
        <Wordmark size={22} />
      </div>

      {/* Center pulse rings */}
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0, zIndex: 2 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: "absolute", top: 0, left: 0,
            width: 130, height: 130, borderRadius: "50%",
            border: `1px solid rgba(255,61,20,${0.30 - i * 0.08})`,
            transform: "translate(-50%,-50%)",
            animation: `auth-ring ${2.4 + i * 0.85}s ease-out ${i * 0.85}s infinite`,
            pointerEvents: "none",
          }} />
        ))}
        {/* Live dot */}
        <div style={{
          position: "absolute", top: -5, right: -5, width: 8, height: 8,
          borderRadius: "50%", background: D.green, boxShadow: `0 0 8px ${D.green}aa`,
          animation: "auth-dot 2s ease-in-out infinite", zIndex: 3,
        }} />
        <div style={{ position: "relative", transform: "translate(-50%,-50%)", zIndex: 2 }}>
          <ZippyMark size={68} />
        </div>
      </div>

      {/* Bottom copy */}
      <div style={{ position: "absolute", bottom: 48, left: 40, right: 40, zIndex: 2 }}>
        <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.045em", color: D.text, lineHeight: 1.22, marginBottom: 10 }}>
          Restaurant ops,<br />at full speed.
        </div>
        <div style={{ fontSize: 13.5, color: D.dim, lineHeight: 1.65, maxWidth: 270, marginBottom: 24 }}>
          Dispatch, kitchen, delivery — one platform built for the line.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["Live driver tracking", "KDS + kitchen routing", "Order dispatch & SLA"].map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 4, height: 4, borderRadius: 1, background: D.zippy, flexShrink: 0 }} />
              <span style={{ fontFamily: D.mono, fontSize: 10.5, color: D.faint, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── OTP verification screen ───────────────────────────────────────────────────
export function OTPScreen({
  phone, onBack, onSuccess,
}: {
  phone: string;
  onBack: () => void;
  onSuccess: (result: { accessToken: string; owner: { id: string; email: string; name: string }; businesses: Array<{ id: string; name: string }>; selectedBusinessId: string | null }) => void;
}) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:4000";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [digitKey, setDigitKey] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleComplete = async (code: string) => {
    if (loading || verified) return;
    setError("");
    setLoading(true);
    try {
      const rawPhone = phone.replace(/\D/g, "");
      const res = await fetch(`${apiBaseUrl}/owners/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: rawPhone, code }),
      });
      const data = await res.json().catch(() => ({})) as {
        accessToken?: string;
        owner?: { id: string; email: string; name: string; phone?: string | null };
        businesses?: Array<{ id: string; name: string }>;
        selectedBusinessId?: string | null;
        error?: string;
        reason?: string;
        remainingAttempts?: number;
      };
      if (!res.ok || !data.accessToken || !data.owner) {
        const msg = data.reason === "OTP_INVALID"
          ? `Incorrect code${data.remainingAttempts !== undefined ? ` · ${data.remainingAttempts} attempt${data.remainingAttempts === 1 ? "" : "s"} left` : ""}`
          : data.reason === "OTP_NOT_FOUND_OR_EXPIRED"
            ? "Code expired. Request a new one."
            : (data.error ?? "Verification failed");
        setError(msg);
        setLoading(false);
        return;
      }
      setLoading(false);
      setVerified(true);
      setTimeout(() => {
        onSuccess({
          accessToken: data.accessToken!,
          owner: { id: data.owner!.id, email: data.owner!.email, name: data.owner!.name },
          businesses: data.businesses ?? [],
          selectedBusinessId: data.selectedBusinessId ?? null,
        });
      }, 1500);
    } catch {
      setError("Could not reach server. Try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setDigitKey(k => k + 1);
    setError("");
    try {
      const rawPhone = phone.replace(/\D/g, "");
      await fetch(`${apiBaseUrl}/owners/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: rawPhone, language: "en" }),
      });
    } catch { /* ignore */ }
    setResending(false);
    setCountdown(30);
  };

  if (verified) {
    return (
      <div style={{ animation: "auth-pop 320ms cubic-bezier(.34,1.45,.64,1)", textAlign: "center" }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: `${D.green}16`, border: `1.5px solid ${D.green}40`,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px",
        }}>
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none" stroke={D.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14l7 7L24 7" strokeDasharray="30" strokeDashoffset="30"
              style={{ animation: "auth-check 480ms ease 60ms both" }} />
          </svg>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.045em", color: D.text, marginBottom: 8 }}>Verified.</div>
        <div style={{ fontSize: 14, color: D.dim }}>Opening your workspace…</div>
      </div>
    );
  }

  return (
    <div style={{ animation: "auth-in 260ms ease", width: "100%", maxWidth: 400 }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          color: D.faint, fontSize: 13.5, fontWeight: 500, marginBottom: 34,
          cursor: "pointer", background: "none", border: "none", padding: 0,
          transition: "color 140ms", fontFamily: "inherit",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = D.dim)}
        onMouseLeave={e => (e.currentTarget.style.color = D.faint)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8l5 5" />
        </svg>
        Back
      </button>

      <Kicker>Verification</Kicker>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.048em", color: D.text, lineHeight: 1.08, marginBottom: 10 }}>
        Check your phone.
      </h1>
      <p style={{ fontSize: 14, color: D.dim, lineHeight: 1.65, marginBottom: 32 }}>
        We sent a 6-digit code to{" "}
        <span style={{ color: D.text, fontFamily: D.mono, fontWeight: 600, fontSize: 13 }}>{phone}</span>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
        <OTPDigits onComplete={handleComplete} hasError={!!error} resetKey={digitKey} />

        <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {error && (
            <span style={{ fontFamily: D.mono, fontSize: 11.5, color: "#ff6688", letterSpacing: "0.05em", animation: "auth-shake 360ms ease" }}>
              ⚠ {error}
            </span>
          )}
          {loading && !error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Spinner size={15} />
              <span style={{ fontFamily: D.mono, fontSize: 12, color: D.dim }}>Verifying…</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          {countdown > 0 ? (
            <span style={{ fontFamily: D.mono, fontSize: 12, color: D.faint, animation: "auth-count 300ms ease" }}>
              Resend in <span style={{ color: D.dim, fontWeight: 600 }}>{countdown}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              style={{ fontFamily: D.mono, fontSize: 12, color: resending ? D.faint : D.zippy, cursor: "pointer", background: "none", border: "none", transition: "color 150ms" }}>
              {resending ? "Sending…" : "Resend code →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
export function SuccessScreen() {
  return (
    <div style={{ animation: "auth-in 280ms ease", textAlign: "center", maxWidth: 400, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{
          width: 84, height: 84, borderRadius: 24,
          background: `${D.zippy}14`, border: `1.5px solid ${D.zippy}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ZippyMark size={48} />
        </div>
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.048em", color: D.text, marginBottom: 10 }}>You&apos;re in.</h1>
      <p style={{ fontSize: 14, color: D.dim, lineHeight: 1.65, marginBottom: 32 }}>
        Loading your Zippy workspace…
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Spinner size={22} />
      </div>
    </div>
  );
}

// ── Auth wrapper (full-screen split) ──────────────────────────────────────────
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", background: D.bg, fontFamily: "var(--font-geist, Geist, sans-serif)" }}>
      <LeftPanel />
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48,
      }}>
        {children}
      </div>
    </div>
  );
}
