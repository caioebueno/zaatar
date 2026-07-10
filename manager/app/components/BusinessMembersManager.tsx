"use client";

import { useMemo, useState } from "react";

type BusinessMember = {
  createdAt: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  userId: string;
};

type BusinessMembersManagerProps = {
  initialError: string | null;
  initialMembers: BusinessMember[];
};

type MemberFormState = {
  email: string;
  name: string;
  phone: string;
  role: "MANAGER" | "ADMIN" | "OWNER";
};

function toErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const message = (payload as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function formatPhone(phone: string | null): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 1)} ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function emptyForm(): MemberFormState {
  return {
    email: "",
    name: "",
    phone: "",
    role: "MANAGER",
  };
}

export default function BusinessMembersManager({
  initialError,
  initialMembers,
}: BusinessMembersManagerProps) {
  const [members, setMembers] = useState<BusinessMember[]>(initialMembers);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<MemberFormState>(emptyForm);

  const totals = useMemo(() => {
    const total = members.length;
    const owners = members.filter((member) => member.role === "OWNER").length;
    const admins = members.filter((member) => member.role === "ADMIN").length;
    const managers = members.filter((member) => member.role === "MANAGER").length;

    return { total, owners, admins, managers };
  }, [members]);

  async function refreshMembers() {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/businesses/current/members", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(toErrorMessage(payload, `Request failed (${response.status})`));
      }

      const nextMembers =
        payload &&
        typeof payload === "object" &&
        "items" in payload &&
        Array.isArray((payload as { items?: unknown }).items)
          ? ((payload as { items: BusinessMember[] }).items ?? [])
          : [];

      setMembers(nextMembers);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not refresh team members",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!form.name.trim()) {
      setIsSaving(false);
      setErrorMessage("Name is required.");
      return;
    }

    if (!form.phone.trim()) {
      setIsSaving(false);
      setErrorMessage("Phone is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      role: form.role,
      ...(form.email.trim() ? { email: form.email.trim().toLowerCase() } : {}),
    };

    try {
      const response = await fetch("/api/businesses/current/members", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json().catch(() => ({}))) as
        | {
            createdUser?: boolean;
            member?: BusinessMember;
            error?: string;
          }
        | unknown;

      if (!response.ok) {
        throw new Error(
          toErrorMessage(responsePayload, `Request failed (${response.status})`),
        );
      }

      const member =
        responsePayload &&
        typeof responsePayload === "object" &&
        "member" in responsePayload &&
        responsePayload.member &&
        typeof responsePayload.member === "object"
          ? (responsePayload.member as BusinessMember)
          : null;

      if (member) {
        setMembers((current) => {
          const next = current.filter((item) => item.userId !== member.userId);
          next.push(member);
          next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          return next;
        });
      } else {
        await refreshMembers();
      }

      const createdUser =
        responsePayload &&
        typeof responsePayload === "object" &&
        "createdUser" in responsePayload &&
        responsePayload.createdUser === true;

      setSuccessMessage(
        createdUser
          ? "User created and added to this business."
          : "Existing user added to this business.",
      );
      setForm(emptyForm());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not add team member",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="team-members-page">
      <section className="analytics-card">
        <div className="team-members-header">
          <div>
            <h2 className="sales-channel-title">Access Overview</h2>
            <p className="sales-channel-muted">
              Add another phone-based login for this business and review who already has access.
            </p>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void refreshMembers()}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="team-members-stats">
          <div className="team-members-stat">
            <span className="team-members-stat-label">Total</span>
            <strong>{totals.total}</strong>
          </div>
          <div className="team-members-stat">
            <span className="team-members-stat-label">Owners</span>
            <strong>{totals.owners}</strong>
          </div>
          <div className="team-members-stat">
            <span className="team-members-stat-label">Admins</span>
            <strong>{totals.admins}</strong>
          </div>
          <div className="team-members-stat">
            <span className="team-members-stat-label">Managers</span>
            <strong>{totals.managers}</strong>
          </div>
        </div>
      </section>

      <section className="analytics-card">
        <h2 className="sales-channel-title">Add Team Member</h2>
        <p className="sales-channel-muted">
          If the phone already belongs to an existing login, we attach that user here. Otherwise,
          we create a new login and they can sign in with OTP.
        </p>

        <form className="auth-form team-members-form" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="team-member-name">
            Full name
          </label>
          <input
            id="team-member-name"
            className="field-input"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Jamie Rivera"
            required
          />

          <label className="field-label" htmlFor="team-member-phone">
            Phone
          </label>
          <input
            id="team-member-phone"
            className="field-input"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="e.g. +1 929 766 9288"
            required
          />

          <label className="field-label" htmlFor="team-member-email">
            Email
          </label>
          <input
            id="team-member-email"
            className="field-input"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="Optional. Leave blank to auto-generate."
          />

          <label className="field-label" htmlFor="team-member-role">
            Role
          </label>
          <select
            id="team-member-role"
            className="field-input"
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as MemberFormState["role"],
              }))
            }
          >
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
            <option value="OWNER">Owner</option>
          </select>

          {errorMessage ? (
            <p className="form-message form-message-error">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="form-message form-message-success">{successMessage}</p>
          ) : null}

          <div className="analytics-actions">
            <button className="button button-primary" type="submit" disabled={isSaving}>
              {isSaving ? "Adding..." : "Add user"}
            </button>
          </div>
        </form>
      </section>

      <section className="analytics-card">
        <h2 className="sales-channel-title">Current Team</h2>
        <p className="sales-channel-muted">
          Everyone below can access the currently selected business.
        </p>

        {members.length === 0 ? (
          <p className="sales-channel-muted">No team members found for this business yet.</p>
        ) : (
          <div className="team-members-list">
            {members.map((member) => (
              <article key={member.userId} className="team-member-card">
                <div className="team-member-card-head">
                  <div>
                    <h3 className="team-member-name">{member.name}</h3>
                    <p className="team-member-email">{member.email}</p>
                  </div>
                  <span className={`team-member-role role-${member.role.toLowerCase()}`}>
                    {member.role}
                  </span>
                </div>
                <div className="team-member-meta">
                  <span>{formatPhone(member.phone)}</span>
                  <span>Joined {formatDate(member.createdAt)}</span>
                  <span>{member.status}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
