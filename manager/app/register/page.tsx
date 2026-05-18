"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuthSession } from "@/src/lib/auth";
import {
  AuthBtn,
  AuthLayout,
  AuthLinkBtn,
  AuthTextInput,
  D,
  Kicker,
  OTPScreen,
  PhoneInput,
  SuccessScreen,
} from "@/app/components/auth/AuthComponents";

type Screen = "details" | "otp" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:4000",
    [],
  );

  const [screen, setScreen] = useState<Screen>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const fullPhone = `${countryCode}${digits}`;

  async function handleRegister() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (digits.length < 10) e.phone = "Enter a valid 10-digit number";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      // Register — auto-generate email+password since auth is phone+OTP only
      const autoEmail = `${countryCode.replace("+", "")}${digits}@auth.zippy.app`;
      const autoPassword = `Zippy${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

      const regRes = await fetch(`${apiBaseUrl}/owners/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: autoEmail, phone: fullPhone, password: autoPassword }),
      });

      if (!regRes.ok) {
        const data = await regRes.json().catch(() => ({})) as { error?: string; field?: string };
        if (data.field === "emailOrPhone") {
          setErrors({ general: "This phone number is already registered. Sign in instead." });
        } else {
          setErrors({ general: data.error ?? "Registration failed. Try again." });
        }
        return;
      }

      // Send OTP
      const otpRes = await fetch(`${apiBaseUrl}/owners/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, language: "en" }),
      });

      if (!otpRes.ok) {
        setErrors({ general: "Account created but could not send verification code. Try signing in." });
        return;
      }

      setScreen("otp");
    } catch {
      setErrors({ general: "Could not reach server. Try again." });
    } finally {
      setLoading(false);
    }
  }

  function handleOTPSuccess(result: {
    accessToken: string;
    owner: { id: string; email: string; name: string };
    businesses: Array<{ id: string; name: string }>;
    selectedBusinessId: string | null;
  }) {
    setScreen("success");
    saveAuthSession({
      accessToken: result.accessToken,
      owner: result.owner,
      businesses: result.businesses,
      selectedBusinessId: result.selectedBusinessId,
    });
    setTimeout(() => {
      router.push("/onboarding");
    }, 800);
  }

  return (
    <AuthLayout>
      {screen === "details" && (
        <div style={{ animation: "auth-in 260ms ease", width: "100%", maxWidth: 400 }}>
          <Kicker>Create account</Kicker>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.048em", color: D.text, lineHeight: 1.08, marginBottom: 10 }}>
            Get started.
          </h1>
          <p style={{ fontSize: 14, color: D.dim, lineHeight: 1.65, marginBottom: 32 }}>
            We&apos;ll send an SMS to verify your number before you&apos;re in.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AuthTextInput
              label="Full name"
              value={name}
              onChange={setName}
              placeholder="e.g. Jamie Rivera"
              error={errors.name}
              autoFocus
            />
            <PhoneInput
              value={phone}
              onChange={setPhone}
              error={errors.phone}
              countryCode={countryCode}
              onCountryChange={setCountryCode}
            />
            {errors.general && (
              <div style={{ fontFamily: D.mono, fontSize: 12, color: "#ff6688", letterSpacing: "0.04em" }}>
                ⚠ {errors.general}
              </div>
            )}
            <div style={{ marginTop: 4 }}>
              <AuthBtn
                label="Send verification code →"
                onClick={handleRegister}
                loading={loading}
                disabled={!name || !phone}
              />
            </div>
          </div>
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <span style={{ fontSize: 13.5, color: D.faint }}>Have an account?&nbsp;</span>
            <AuthLinkBtn onClick={() => router.push("/login")}>Sign in →</AuthLinkBtn>
          </div>
        </div>
      )}

      {screen === "otp" && (
        <OTPScreen
          phone={fullPhone}
          onBack={() => setScreen("details")}
          onSuccess={handleOTPSuccess}
        />
      )}

      {screen === "success" && <SuccessScreen />}
    </AuthLayout>
  );
}
