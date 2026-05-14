 "use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuthSession } from "@/src/lib/auth";

type RegisterResponse = {
  error?: string;
  field?: string;
  ok?: boolean;
};

type LoginResponse = {
  accessToken?: string;
  businesses?: Array<{
    id: string;
    name: string;
  }>;
  error?: string;
  field?: string;
  owner?: {
    email: string;
    id: string;
    name: string;
  };
  selectedBusinessId?: string | null;
};

export default function RegisterPage() {
  const router = useRouter();
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:4000",
    [],
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/owners/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as RegisterResponse;

      if (!response.ok) {
        const message = data.field
          ? `${data.error ?? "Invalid payload"} (${data.field})`
          : (data.error ?? "Failed to create account");
        setErrorMessage(message);
        return;
      }

      const loginResponse = await fetch(`${apiBaseUrl}/owners/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const loginPayload = (await loginResponse.json().catch(() => ({}))) as LoginResponse;

      if (loginResponse.ok && loginPayload.accessToken && loginPayload.owner) {
        saveAuthSession({
          accessToken: loginPayload.accessToken,
          owner: loginPayload.owner,
          businesses: Array.isArray(loginPayload.businesses) ? loginPayload.businesses : [],
          selectedBusinessId:
            typeof loginPayload.selectedBusinessId === "string"
              ? loginPayload.selectedBusinessId
              : null,
        });
        router.push("/onboarding");
        return;
      }

      setSuccessMessage("Account created successfully. Please sign in.");
      setName("");
      setEmail("");
      setPassword("");
      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch {
      setErrorMessage("Could not reach API server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1 className="auth-title">Register</h1>
        <p className="auth-subtitle">Create your manager account.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            className="field-input"
            id="name"
            name="name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
            required
          />

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
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            required
          />

          {errorMessage ? (
            <p className="form-message form-message-error">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="form-message form-message-success">{successMessage}</p>
          ) : null}

          <button className="button button-primary" type="submit">
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="auth-footnote">
          Already have an account?{" "}
          <Link className="text-link" href="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
