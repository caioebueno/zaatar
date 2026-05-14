 "use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuthSession, setSelectedBusinessIdSession } from "@/src/lib/auth";

type LoginResponse = {
  accessToken?: string;
  businesses?: Array<{
    id: string;
    name: string;
  }>;
  error?: string;
  expiresAt?: string;
  field?: string;
  ok?: boolean;
  owner?: {
    email: string;
    id: string;
    name: string;
  };
  selectedBusinessId?: string | null;
};

export default function LoginPage() {
  const router = useRouter();
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:4000",
    [],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/owners/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok || !data.accessToken || !data.owner) {
        const message = data.field
          ? `${data.error ?? "Invalid payload"} (${data.field})`
          : (data.error ?? "Failed to login");
        setErrorMessage(message);
        return;
      }

      const businesses = Array.isArray(data.businesses) ? data.businesses : [];

      saveAuthSession({
        accessToken: data.accessToken,
        owner: data.owner,
        businesses,
        selectedBusinessId: null,
      });

      setSelectedBusinessIdSession(null);

      if (businesses.length === 0) {
        router.push("/onboarding");
        return;
      }

      router.push("/business/select");
    } catch {
      setErrorMessage("Could not reach API server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Access your manager account.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            className="field-input"
            id="email"
            name="email"
            type="email"
            placeholder="you@business.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            required
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            className="field-input"
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            required
          />

          {errorMessage ? (
            <p className="form-message form-message-error">{errorMessage}</p>
          ) : null}

          <button className="button button-primary" type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footnote">
          Don&apos;t have an account?{" "}
          <Link className="text-link" href="/register">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
