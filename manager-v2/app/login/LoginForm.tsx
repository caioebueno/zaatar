"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ApiError, sendOwnerOtp, toApiPhone, verifyOwnerOtp } from "../lib/api";
import { saveManagerSession } from "../lib/auth";
import { Menu, MenuItem } from "../(app)/_components/Menu";

/* ── Config ────────────────────────────────────────────────── */
const RESEND_SECONDS = 30;

type Step = "phone" | "otp" | "success";

type Country = {
  code: string;
  name: string;
  iso: string;
  /** Mask where '#' is a digit slot; any other char is a literal separator. */
  mask: string;
  placeholder: string;
};

const COUNTRIES: Country[] = [
  { code: "+1", name: "United States", iso: "US", mask: "(###) ###-####", placeholder: "(415) 555-0132" },
  { code: "+1", name: "Canada", iso: "CA", mask: "(###) ###-####", placeholder: "(416) 555-0132" },
  { code: "+44", name: "United Kingdom", iso: "GB", mask: "##### ######", placeholder: "07123 456789" },
  { code: "+91", name: "India", iso: "IN", mask: "##### #####", placeholder: "98765 43210" },
  { code: "+52", name: "Mexico", iso: "MX", mask: "## #### ####", placeholder: "55 1234 5678" },
  { code: "+55", name: "Brazil", iso: "BR", mask: "(##) #####-####", placeholder: "(11) 91234-5678" },
  { code: "+61", name: "Australia", iso: "AU", mask: "### ### ###", placeholder: "412 345 678" },
];

/** Formats a run of digits into the given mask, dropping digits past the mask's capacity. */
function formatPhone(digits: string, mask: string): string {
  let out = "";
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    out += mask[i] === "#" ? digits[di++] : mask[i];
  }
  return out;
}

/** Maps a send-OTP failure to a user-facing message. */
function sendErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return "We couldn't find an account for this number.";
    if (err.status === 400) return "Enter a valid phone number.";
    if (err.status === 0) return "Can't reach the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

/** Maps a verify-OTP failure to a user-facing message. */
function verifyErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.reason === "OTP_INVALID") {
      return err.remainingAttempts != null
        ? `Incorrect code. ${err.remainingAttempts} ${err.remainingAttempts === 1 ? "attempt" : "attempts"} left.`
        : "Incorrect code. Try again.";
    }
    if (err.reason === "OTP_NOT_FOUND_OR_EXPIRED") return "That code expired. Request a new one.";
    if (err.status === 404) return "We couldn't find an account for this number.";
    if (err.status === 0) return "Can't reach the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

const FONT_DISPLAY = "var(--font-display)";
const FONT_BODY = "var(--font-body)";
const FONT_MONO = "var(--font-mono)";

const focusRing: CSSProperties = {
  border: "1px solid #FF5C1A",
  boxShadow: "0 0 0 3px rgba(255,92,26,0.2)",
};

const fieldBase: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  height: 38,
  lineHeight: "38px",
  background: "#222226",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "0 12px",
  fontSize: 13,
  color: "#F1F1F2",
  outline: "none",
  fontFamily: FONT_BODY,
  transition: "border-color 150ms var(--ease-out-expo), box-shadow 150ms var(--ease-out-expo), background 150ms var(--ease-out-expo)",
};

const heading: CSSProperties = {
  fontFamily: FONT_DISPLAY,
  fontWeight: 700,
  fontSize: 24,
  color: "#F1F1F2",
  marginBottom: 6,
};

const subheading: CSSProperties = {
  fontSize: 13,
  color: "#B4B5BA",
  lineHeight: 1.5,
};

const loadingBtnStyle: CSSProperties = {
  width: "100%",
  height: 42,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  background: "#FF5C1A",
  color: "#171717",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: FONT_BODY,
};

const spinnerStyle: CSSProperties = {
  width: 15,
  height: 15,
  borderRadius: "9999px",
  boxSizing: "border-box",
  border: "2px solid rgba(23,23,23,0.3)",
  borderTopColor: "#171717",
  animation: "zspin 0.7s linear infinite",
};

const EMPTY_OTP = ["", "", "", "", "", ""];

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [countryIdx, setCountryIdx] = useState(0);
  const [countryOpen, setCountryOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otp, setOtp] = useState<string[]>(EMPTY_OTP);
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const otpEls = useRef<(HTMLInputElement | null)[]>([]);
  const timerInt = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearTimer = useCallback(() => {
    if (timerInt.current) {
      clearInterval(timerInt.current);
      timerInt.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  // Once verified, head to the app. The app-shell guard sends the user on to
  // /select-business when no business context is set yet.
  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(() => router.push("/orders"), 1200);
    return () => clearTimeout(t);
  }, [step, router]);

  const selectedCountry = COUNTRIES[countryIdx];

  const startTimer = useCallback(() => {
    clearTimer();
    setTimer(RESEND_SECONDS);
    setTimerActive(true);
    setCanResend(false);
    timerInt.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearTimer();
          setTimerActive(false);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const focusFirstOtp = () => {
    setTimeout(() => otpEls.current[0]?.focus(), 50);
  };

  const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setPhone(formatPhone(digits, selectedCountry.mask));
    setPhoneError("");
  };

  const selectCountry = (i: number) => {
    const digits = phone.replace(/\D/g, "");
    setCountryIdx(i);
    setPhone(formatPhone(digits, COUNTRIES[i].mask));
    setCountryOpen(false);
  };

  const apiPhone = () => toApiPhone(selectedCountry.code, phone);

  const submitPhone = async () => {
    if (sending) return;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) {
      setPhoneError("Enter a valid phone number.");
      return;
    }
    setSending(true);
    setPhoneError("");
    try {
      await sendOwnerOtp(apiPhone());
      setStep("otp");
      setOtp(EMPTY_OTP);
      setOtpError("");
      startTimer();
      focusFirstOtp();
    } catch (err) {
      setPhoneError(sendErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    setOtpError("");
    if (d && i < 5) otpEls.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpEls.current[i - 1]?.focus();
    }
  };

  const editPhone = () => {
    clearTimer();
    setStep("phone");
    setOtp(EMPTY_OTP);
    setOtpError("");
  };

  const resend = async () => {
    setOtp(EMPTY_OTP);
    setOtpError("");
    try {
      await sendOwnerOtp(apiPhone());
      startTimer();
      focusFirstOtp();
    } catch (err) {
      setOtpError(sendErrorMessage(err));
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6 || verifying) return;
    setVerifying(true);
    setOtpError("");
    try {
      const result = await verifyOwnerOtp(apiPhone(), code);
      clearTimer();
      // Persists the token and (if the API preselected one) the business context.
      saveManagerSession(result);
      setVerifying(false);
      setStep("success");
    } catch (err) {
      setVerifying(false);
      setOtpError(verifyErrorMessage(err));
      setOtp(EMPTY_OTP);
      otpEls.current[0]?.focus();
    }
  };

  const continueDisabled = phone.trim().length === 0;
  const otpFilled = otp.every((d) => d);
  const timerLabel = timer < 10 ? "0" + timer : String(timer);

  const phoneInputStyle: CSSProperties = {
    ...fieldBase,
    flex: 1,
    ...(phoneError ? { border: "1px solid #EF4444" } : {}),
    ...(focused === "phone" ? focusRing : {}),
  };

  const primaryBtnStyle = (disabled: boolean): CSSProperties => ({
    width: "100%",
    marginTop: 20,
    height: 42,
    background: "#FF5C1A",
    color: "#171717",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONT_BODY,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "#17181C",
        fontFamily: FONT_BODY,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: 380, display: "flex", flexDirection: "column", gap: 32 }}>
          {/* ── Phone step ────────────────────────────────── */}
          {step === "phone" && (
            <div>
              <div style={heading}>Sign in to Zappy</div>
              <div style={{ ...subheading, marginBottom: 28 }}>
                Enter your phone number to receive a one-time code.
              </div>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#B4B5BA",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}
              >
                Phone number
              </div>
              <div style={{ display: "flex", gap: 8, position: "relative" }}>
                <Menu
                  open={countryOpen}
                  onOpenChange={setCountryOpen}
                  align="start"
                  sideOffset={6}
                  contentStyle={{ width: 200, padding: 6 }}
                  trigger={
                    <button
                      type="button"
                      className="zp-country-trigger"
                      aria-haspopup="listbox"
                      style={{
                        width: 104,
                        height: 38,
                        background: "#222226",
                        border: countryOpen ? "1px solid #FF5C1A" : "1px solid rgba(255,255,255,0.1)",
                        boxShadow: countryOpen ? "0 0 0 3px rgba(255,92,26,0.2)" : "none",
                        borderRadius: 6,
                        padding: "0 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        color: "#F1F1F2",
                        fontSize: 13,
                        fontFamily: FONT_BODY,
                        transition:
                          "border-color 150ms var(--ease-out-expo), box-shadow 150ms var(--ease-out-expo), background 150ms var(--ease-out-expo)",
                      }}
                    >
                      <span>
                        {selectedCountry.iso} {selectedCountry.code}
                      </span>
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        style={{
                          transform: countryOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 180ms var(--ease-out-expo)",
                        }}
                      >
                        <path d="M1 1L5 5L9 1" stroke="#B4B5BA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  }
                >
                  {COUNTRIES.map((c, i) => (
                    <MenuItem
                      key={`${c.iso}-${c.code}`}
                      onSelect={() => selectCountry(i)}
                      style={{ padding: "9px 12px", fontSize: 13, color: "#F1F1F2", display: "flex", justifyContent: "space-between" }}
                    >
                      <span>{c.name}</span>
                      <span style={{ color: "#B4B5BA" }}>{c.code}</span>
                    </MenuItem>
                  ))}
                </Menu>
                <input
                  type="tel"
                  placeholder={selectedCountry.placeholder}
                  value={phone}
                  onChange={onPhoneChange}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                  style={phoneInputStyle}
                />
              </div>
              {phoneError && (
                <div style={{ fontSize: 11, color: "#F87171", marginTop: 6 }}>{phoneError}</div>
              )}

              <button
                type="button"
                className="zp-primary-btn"
                onClick={submitPhone}
                disabled={continueDisabled || sending}
                style={primaryBtnStyle(continueDisabled || sending)}
              >
                {sending ? "Sending…" : "Continue"}
              </button>
            </div>
          )}

          {/* ── OTP step ──────────────────────────────────── */}
          {step === "otp" && (
            <div>
              <button
                type="button"
                onClick={editPhone}
                style={{
                  background: "none",
                  border: "none",
                  color: "#B4B5BA",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: 0,
                  marginBottom: 20,
                  fontFamily: FONT_BODY,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B4B5BA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              <div style={heading}>Enter the code</div>
              <div style={{ ...subheading, marginBottom: 28 }}>
                We sent a 6-digit code to {selectedCountry.code} {phone}.{" "}
                <span onClick={editPhone} style={{ color: "#FF5C1A", cursor: "pointer" }}>
                  Edit
                </span>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {otp.map((v, i) => (
                  <input
                    key={i}
                    maxLength={1}
                    inputMode="numeric"
                    ref={(el) => {
                      otpEls.current[i] = el;
                    }}
                    value={v}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onFocus={() => setFocused("otp" + i)}
                    onBlur={() => setFocused(null)}
                    style={{
                      width: 48,
                      height: 56,
                      textAlign: "center",
                      fontSize: 24,
                      fontFamily: FONT_MONO,
                      fontWeight: 500,
                      background: "#222226",
                      border: otpError ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      color: "#F1F1F2",
                      outline: "none",
                      animation: otpError ? "shake 0.35s" : "none",
                      transition:
                        "border-color 150ms var(--ease-out-expo), box-shadow 150ms var(--ease-out-expo), background 150ms var(--ease-out-expo)",
                      ...(focused === "otp" + i ? focusRing : {}),
                    }}
                  />
                ))}
              </div>
              {otpError && (
                <div style={{ fontSize: 11, color: "#F87171", marginTop: 10 }}>{otpError}</div>
              )}

              <div style={{ marginTop: 14, fontSize: 12.5 }}>
                {timerActive && (
                  <span style={{ color: "#B4B5BA" }}>Resend code in 0:{timerLabel}</span>
                )}
                {canResend && (
                  <span onClick={resend} style={{ color: "#FF5C1A", cursor: "pointer", fontWeight: 500 }}>
                    Resend code
                  </span>
                )}
              </div>

              <button
                type="button"
                className="zp-primary-btn"
                onClick={verifyOtp}
                disabled={!otpFilled || verifying}
                style={primaryBtnStyle(!otpFilled || verifying)}
              >
                {verifying ? "Verifying…" : "Verify and continue"}
              </button>
            </div>
          )}

          {/* ── Success step ──────────────────────────────── */}
          {step === "success" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 9999,
                  background: "rgba(34,197,94,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: "#F1F1F2", marginBottom: 6 }}>
                Verified
              </div>
              <div style={{ fontSize: 13, color: "#B4B5BA", marginBottom: 24 }}>Signing you in…</div>
              <div style={loadingBtnStyle}>
                <span style={spinnerStyle} />
                <span>Signing in…</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
