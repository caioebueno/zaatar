"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type RegisterState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function getErrorMessage(payload: { error?: string; field?: string } | null): string {
  if (!payload) return "Unable to register right now.";

  if (payload.error === "Email already registered") {
    return "Email already registered.";
  }

  if (payload.error === "Invalid payload" && payload.field) {
    if (payload.field === "name") return "Please enter your name.";
    if (payload.field === "email") return "Please enter a valid email.";
    if (payload.field === "password") {
      return "Password must have at least 8 characters.";
    }
  }

  return payload.error || "Unable to register right now.";
}

export default function RegisterForm() {
  const [state, setState] = useState<RegisterState>({ status: "idle" });
  const isLoading = state.status === "loading";

  const statusMessage = useMemo(() => {
    if (state.status === "success") {
      return <p className="text-sm text-green-700">{state.message}</p>;
    }

    if (state.status === "error") {
      return <p className="text-sm text-rose-700">{state.message}</p>;
    }

    return null;
  }, [state]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setState({ status: "error", message: "Passwords do not match." });
      return;
    }

    setState({ status: "loading" });

    try {
      const response = await fetch("/api/users/register", {
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

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; field?: string }
          | null;

        setState({ status: "error", message: getErrorMessage(payload) });
        return;
      }

      form.reset();
      setState({
        status: "success",
        message: "Account created successfully.",
      });
    } catch {
      setState({ status: "error", message: "Unable to register right now." });
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">Create account</h1>
      <p className="mt-1 text-sm text-zinc-500">Register with email and password.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Name</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Your name"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="At least 8 characters"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Repeat password"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-4 min-h-6">{statusMessage}</div>

      <div className="mt-2 text-sm text-zinc-600">
        <Link href="/" className="font-medium text-zinc-900 hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
