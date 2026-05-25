"use client";

import { useState } from "react";

type CustomerAddress = {
  city: string;
  complement: string | null;
  createdAt: string;
  customerId: string | null;
  deliveryFee: number;
  description: string;
  id: string;
  lat: string;
  lng: string;
  number: string;
  numberComplement: string | null;
  state: string;
  street: string;
  zipCode: string;
};

type Customer = {
  address: string | null;
  addresses: CustomerAddress[];
  createdAt: string;
  email: string | null;
  id: string;
  name: string | null;
  phone: string | null;
};

type CustomersManagerProps = {
  initialCustomers?: Customer[];
  initialError?: string | null;
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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatPhone(phone: string | null): string {
  if (!phone) return "-";
  if (phone.length <= 4) return phone;
  if (phone.length <= 7) return `${phone.slice(0, 3)}-${phone.slice(3)}`;
  return `${phone.slice(0, 1)} ${phone.slice(1, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
}

export default function CustomersManager({
  initialCustomers = [],
  initialError = null,
}: CustomersManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [form, setForm] = useState({
    phone: "",
    name: "",
    email: "",
    address: "",
  });

  async function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSearching(true);

    try {
      const phone = searchPhone.trim();
      if (!phone) {
        setCustomers([]);
        return;
      }

      const response = await fetch(
        `/api/customers/search?phone=${encodeURIComponent(phone)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) {
        throw new Error(toErrorMessage(payload, `Request failed (${response.status})`));
      }

      const items = Array.isArray(payload) ? (payload as Customer[]) : [];
      setCustomers(items);
      setSuccessMessage(
        items.length > 0
          ? `Found ${items.length} customer${items.length > 1 ? "s" : ""}.`
          : "No customers found for this phone.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not search customers",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const phone = form.phone.trim();
    if (!phone) {
      setErrorMessage("Phone is required.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          phone,
          ...(form.name.trim() ? { name: form.name.trim() } : {}),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          ...(form.address.trim() ? { address: form.address.trim() } : {}),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) {
        throw new Error(toErrorMessage(payload, `Request failed (${response.status})`));
      }

      const customer = payload as Customer;
      setCustomers((current) => {
        const withoutCurrent = current.filter((item) => item.id !== customer.id);
        return [customer, ...withoutCurrent];
      });
      setSearchPhone(customer.phone ?? phone);
      setForm({ phone: "", name: "", email: "", address: "" });
      setSuccessMessage("Customer saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save customer",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="manager-page">
      <div className="drivers-header-row">
        <div>
          <h1 className="manager-page-title">Customers</h1>
          <p className="manager-page-subtitle">
            Search by phone, create customers, and view their saved addresses.
          </p>
        </div>
      </div>

      {errorMessage ? <p className="sales-channel-feedback is-error">{errorMessage}</p> : null}
      {successMessage ? (
        <p className="sales-channel-feedback is-success">{successMessage}</p>
      ) : null}

      <section className="analytics-card">
        <h2 className="sales-channel-subtitle">Search customers</h2>
        <form onSubmit={onSearch} className="analytics-filters">
          <label className="analytics-field">
            <span>Phone</span>
            <input
              type="text"
              value={searchPhone}
              onChange={(event) => setSearchPhone(event.target.value)}
              placeholder="19297669288"
            />
          </label>
          <div className="analytics-actions">
            <button type="submit" className="button button-secondary" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
      </section>

      <section className="analytics-card">
        <h2 className="sales-channel-subtitle">Create customer</h2>
        <form onSubmit={onCreate} className="analytics-filters">
          <label className="analytics-field">
            <span>Phone *</span>
            <input
              type="text"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="19297669288"
              required
            />
          </label>
          <label className="analytics-field">
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="John Doe"
            />
          </label>
          <label className="analytics-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="john@example.com"
            />
          </label>
          <label className="analytics-field">
            <span>Address</span>
            <input
              type="text"
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="Optional"
            />
          </label>
          <div className="analytics-actions">
            <button type="submit" className="button button-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save customer"}
            </button>
          </div>
        </form>
      </section>

      <section className="analytics-card">
        <h2 className="sales-channel-subtitle">Results</h2>
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Saved addresses</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="sales-channel-muted">
                    No customers loaded yet.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name || "-"}</td>
                    <td>{formatPhone(customer.phone)}</td>
                    <td>{customer.email || "-"}</td>
                    <td>{customer.addresses.length}</td>
                    <td>{formatDate(customer.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
