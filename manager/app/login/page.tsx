"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuthSession, setSelectedBusinessIdSession } from "@/src/lib/auth";
import {
  AuthBtn,
  AuthLayout,
  AuthLinkBtn,
  D,
  Kicker,
  OTPScreen,
  PhoneInput,
  SuccessScreen,
} from "@/app/components/auth/AuthComponents";

type Screen = "phone" | "otp" | "success";

export default function LoginPage() {
  const router = useRouter();
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:4000",
    [],
  );

  const [screen, setScreen] = useState<Screen>("phone");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  const fullPhone = `${countryCode}${phone.replace(/\D/g, "")}`;

  async function handleContinue() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setPhoneError("Enter a valid 10-digit number");
      return;
    }
    setPhoneError("");
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/owners/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `${countryCode}${digits}`, language: "en" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setPhoneError(data.error ?? "Could not send code. Check your number.");
        return;
      }
      setScreen("otp");
    } catch {
      setPhoneError("Could not reach server. Try again.");
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
    setSelectedBusinessIdSession(result.selectedBusinessId);
    setTimeout(() => {
      if (result.businesses.length === 0) {
        router.push("/onboarding");
      } else {
        router.push("/business/select");
      }
    }, 800);
  }

  return (
    <AuthLayout>
      {screen === "phone" && (
        <div style={{ animation: "auth-in 260ms ease", width: "100%", maxWidth: 400 }}>
          <Kicker>Sign in</Kicker>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.048em", color: D.text, lineHeight: 1.08, marginBottom: 10 }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: 14, color: D.dim, lineHeight: 1.65, marginBottom: 32 }}>
            Enter your number and we&apos;ll send a one-time code via SMS.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              error={phoneError}
              countryCode={countryCode}
              onCountryChange={setCountryCode}
            />
            <AuthBtn
              label="Continue →"
              onClick={handleContinue}
              loading={loading}
              disabled={!phone}
            />
          </div>
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <span style={{ fontSize: 13.5, color: D.faint }}>No account?&nbsp;</span>
            <AuthLinkBtn onClick={() => router.push("/register")}>Create one →</AuthLinkBtn>
          </div>
        </div>
      )}

      {screen === "otp" && (
        <OTPScreen
          phone={fullPhone}
          onBack={() => setScreen("phone")}
          onSuccess={handleOTPSuccess}
        />
      )}

      {screen === "success" && <SuccessScreen />}
    </AuthLayout>
  );
}
