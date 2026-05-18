"use client";

import { useMemo, useState } from "react";

type Driver = {
  active: boolean;
  createdAt: string;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
};

type DriversManagerProps = {
  initialDrivers: Driver[];
  initialError: string | null;
};

type DriverFormState = {
  active: boolean;
  name: string;
  phone: string;
  priorityLevel: string;
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

  if (phone.length <= 4) return phone;
  if (phone.length <= 7) return `${phone.slice(0, 3)}-${phone.slice(3)}`;

  return `${phone.slice(0, 1)} ${phone.slice(1, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
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

function getDefaultForm(drivers: Driver[]): DriverFormState {
  const maxPriority = drivers.reduce(
    (max, driver) => Math.max(max, driver.priorityLevel),
    -1,
  );

  return {
    name: "",
    phone: "",
    active: true,
    priorityLevel: String(maxPriority + 1),
  };
}

export default function DriversManager({
  initialDrivers,
  initialError,
}: DriversManagerProps) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [isLoadingDriver, setIsLoadingDriver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);
  const [form, setForm] = useState<DriverFormState>(() => getDefaultForm(initialDrivers));

  const totals = useMemo(() => {
    const total = drivers.length;
    const active = drivers.filter((driver) => driver.active).length;
    const inactive = total - active;

    return { total, active, inactive };
  }, [drivers]);

  async function refreshDrivers() {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/drivers", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(toErrorMessage(payload, `Request failed (${response.status})`));
      }

      const items = Array.isArray(payload)
        ? payload
        : payload &&
            typeof payload === "object" &&
            "items" in payload &&
            Array.isArray((payload as { items?: unknown }).items)
          ? ((payload as { items: unknown[] }).items as Driver[])
          : [];

      setDrivers(items);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not refresh drivers",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  function openCreateModal() {
    setSuccessMessage(null);
    setErrorMessage(null);
    setEditingDriverId(null);
    setForm(getDefaultForm(drivers));
    setIsFormOpen(true);
  }

  async function openEditModal(driverId: string) {
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsLoadingDriver(true);

    try {
      const response = await fetch(`/api/drivers/${encodeURIComponent(driverId)}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(toErrorMessage(payload, `Request failed (${response.status})`));
      }

      const driver = payload as Driver;
      setEditingDriverId(driver.id);
      setForm({
        name: driver.name,
        phone: driver.phone ?? "",
        active: driver.active,
        priorityLevel: String(driver.priorityLevel),
      });
      setIsFormOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load driver",
      );
    } finally {
      setIsLoadingDriver(false);
    }
  }

  async function onDelete(driver: Driver) {
    const confirmed = window.confirm(
      `Delete driver \"${driver.name}\"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingDriverId(driver.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/drivers/${encodeURIComponent(driver.id)}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(toErrorMessage(payload, `Request failed (${response.status})`));
      }

      setDrivers((current) => current.filter((item) => item.id !== driver.id));
      setSuccessMessage("Driver deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not delete driver",
      );
    } finally {
      setDeletingDriverId(null);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const priorityLevelTrimmed = form.priorityLevel.trim();

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

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      active: form.active,
    };

    if (priorityLevelTrimmed) {
      const parsed = Number(priorityLevelTrimmed);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setIsSaving(false);
        setErrorMessage("Priority level must be a non-negative integer.");
        return;
      }
      payload.priorityLevel = parsed;
    }

    try {
      const isEditing = Boolean(editingDriverId);
      const response = await fetch(
        isEditing
          ? `/api/drivers/${encodeURIComponent(editingDriverId as string)}`
          : "/api/drivers",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const responsePayload = (await response.json().catch(() => ({}))) as unknown;

      if (!response.ok) {
        throw new Error(
          toErrorMessage(responsePayload, `Request failed (${response.status})`),
        );
      }

      const savedDriver = responsePayload as Driver;

      if (isEditing) {
        setDrivers((current) =>
          current
            .map((driver) => (driver.id === savedDriver.id ? savedDriver : driver))
            .sort((left, right) => left.priorityLevel - right.priorityLevel),
        );
        setSuccessMessage("Driver updated.");
      } else {
        setDrivers((current) =>
          [...current, savedDriver].sort(
            (left, right) => left.priorityLevel - right.priorityLevel,
          ),
        );
        setSuccessMessage("Driver created.");
      }

      setIsFormOpen(false);
      setEditingDriverId(null);
      setForm(getDefaultForm(drivers));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save driver",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="manager-page drivers-page">
      <div className="drivers-header-row">
        <div>
          <h1 className="manager-page-title">Drivers</h1>
          <p className="manager-page-subtitle">
            Create and manage delivery drivers for dispatch operations.
          </p>
        </div>
        <div className="drivers-header-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void refreshDrivers()}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className="button button-primary" onClick={openCreateModal}>
            New driver
          </button>
        </div>
      </div>

      {errorMessage ? <p className="sales-channel-feedback is-error">{errorMessage}</p> : null}
      {successMessage ? (
        <p className="sales-channel-feedback is-success">{successMessage}</p>
      ) : null}

      <section className="analytics-summary-grid drivers-summary-grid">
        <article className="analytics-summary-item">
          <p className="dashboard-label">Total drivers</p>
          <p className="dashboard-value">{totals.total}</p>
        </article>
        <article className="analytics-summary-item">
          <p className="dashboard-label">Active</p>
          <p className="dashboard-value">{totals.active}</p>
        </article>
        <article className="analytics-summary-item">
          <p className="dashboard-label">Inactive</p>
          <p className="dashboard-value">{totals.inactive}</p>
        </article>
      </section>

      <section className="analytics-card">
        <h2 className="sales-channel-subtitle">Driver list</h2>

        <div className="analytics-table-wrap">
          <table className="analytics-table drivers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td>{driver.name}</td>
                  <td>{formatPhone(driver.phone)}</td>
                  <td>{driver.priorityLevel}</td>
                  <td>
                    <span
                      className={`feedback-sentiment-badge ${
                        driver.active ? "is-positive" : "is-negative"
                      }`}
                    >
                      {driver.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDate(driver.createdAt)}</td>
                  <td>
                    <div className="drivers-table-actions">
                      <button
                        type="button"
                        className="button button-secondary drivers-table-button"
                        onClick={() => void openEditModal(driver.id)}
                        disabled={isLoadingDriver || deletingDriverId === driver.id}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button-secondary drivers-table-button is-danger"
                        onClick={() => void onDelete(driver)}
                        disabled={deletingDriverId === driver.id}
                      >
                        {deletingDriverId === driver.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={6}>No drivers yet. Create the first driver to get started.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen ? (
        <div className="drivers-modal-root" role="dialog" aria-modal="true">
          <button
            type="button"
            className="drivers-modal-backdrop"
            onClick={() => setIsFormOpen(false)}
            aria-label="Close driver form"
          />
          <div className="drivers-modal-card">
            <div className="drivers-modal-header">
              <h3>{editingDriverId ? "Edit driver" : "Create driver"}</h3>
              <button
                type="button"
                className="drivers-modal-close"
                onClick={() => setIsFormOpen(false)}
              >
                Close
              </button>
            </div>

            <form className="drivers-form" onSubmit={onSubmit}>
              <div className="drivers-form-grid">
                <label className="analytics-field">
                  <span className="field-label">Name</span>
                  <input
                    className="field-input"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="e.g. Carlos"
                    required
                  />
                </label>

                <label className="analytics-field">
                  <span className="field-label">Phone</span>
                  <input
                    className="field-input"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="e.g. 19297669288"
                    required
                  />
                </label>

                <label className="analytics-field">
                  <span className="field-label">Priority level</span>
                  <input
                    className="field-input"
                    type="number"
                    min={0}
                    step={1}
                    value={form.priorityLevel}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, priorityLevel: event.target.value }))
                    }
                    placeholder="Auto"
                  />
                </label>

                <label className="sales-channel-check drivers-active-check">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, active: event.target.checked }))
                    }
                  />
                  Active driver
                </label>
              </div>

              <div className="drivers-form-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={isSaving}>
                  {isSaving
                    ? editingDriverId
                      ? "Saving..."
                      : "Creating..."
                    : editingDriverId
                      ? "Save changes"
                      : "Create driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
