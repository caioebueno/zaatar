"use client";

import Link from "next/link";
import { readOwnerSession } from "@/src/lib/auth";

export default function MainDashboard() {
  const owner = readOwnerSession();

  return (
    <div className="manager-page">
      <h1 className="manager-page-title">Dashboard</h1>
      <p className="manager-page-subtitle">
        {owner ? `Welcome back, ${owner.name}.` : "Welcome back."}
      </p>

      <div className="dashboard-card">
        <p className="dashboard-label">Authenticated session</p>
        <p className="dashboard-value">{owner?.email ?? "Unknown owner"}</p>
      </div>

      <div className="dashboard-card">
        <p className="dashboard-label">First-time setup</p>
        <p className="dashboard-value">Complete onboarding before going live.</p>
        <p>
          <Link className="text-link" href="/onboarding">
            Open onboarding
          </Link>
        </p>
      </div>
    </div>
  );
}
