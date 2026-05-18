"use client";

import { useRef, useState } from "react";

type OrderLinkSettings = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  businessId: string;
  logoUrl: string | null;
  name: string;
  orderLinkUrl: string;
};

type Props = {
  initialSettings: OrderLinkSettings;
};

type ApiError = {
  error?: string;
  field?: string;
};

function normalizeHexColor(input: string): string {
  const value = input.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  if (/^[0-9a-f]{6}$/.test(value)) return `#${value}`;
  return value;
}

export default function OrderLinkSettingsForm({ initialSettings }: Props) {
  const [name, setName] = useState(initialSettings.name);
  const [brandColor, setBrandColor] = useState(initialSettings.brandColor);
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl ?? "");
  const [bannerPhotoUrl, setBannerPhotoUrl] = useState(initialSettings.bannerPhotoUrl ?? "");
  const [orderLinkUrl, setOrderLinkUrl] = useState(initialSettings.orderLinkUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  async function uploadImage(
    file: File,
    target: "logo" | "banner",
  ): Promise<void> {
    const formData = new FormData();
    formData.set("file", file);

    if (target === "logo") setUploadingLogo(true);
    if (target === "banner") setUploadingBanner(true);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await fetch("/api/bucket/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        url?: unknown;
        error?: string;
      };

      if (!response.ok || typeof payload.url !== "string") {
        setMessage(payload.error ?? "Could not upload image.");
        setMessageType("error");
        return;
      }

      if (target === "logo") setLogoUrl(payload.url);
      if (target === "banner") setBannerPhotoUrl(payload.url);
      setMessage("Image uploaded successfully.");
      setMessageType("success");
    } catch {
      setMessage("Could not upload image.");
      setMessageType("error");
    } finally {
      if (target === "logo") setUploadingLogo(false);
      if (target === "banner") setUploadingBanner(false);
    }
  }

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setMessage(null);
    setMessageType(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/businesses/current/settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name,
          brandColor: normalizeHexColor(brandColor),
          logoUrl: logoUrl.trim() || null,
          bannerPhotoUrl: bannerPhotoUrl.trim() || null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | (OrderLinkSettings & ApiError)
        | ApiError;

      if (!response.ok) {
        const fieldSuffix =
          typeof payload.field === "string" ? ` (${payload.field})` : "";
        setMessage((payload.error ?? "Could not save settings.") + fieldSuffix);
        setMessageType("error");
        return;
      }

      if (
        payload &&
        typeof payload === "object" &&
        "orderLinkUrl" in payload &&
        typeof payload.orderLinkUrl === "string"
      ) {
        setOrderLinkUrl(payload.orderLinkUrl);
      }

      setMessage("Order link settings saved.");
      setMessageType("success");
    } catch {
      setMessage("Could not save settings.");
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="analytics-card">
      <form className="auth-form" onSubmit={onSave}>
        <label className="field-label" htmlFor="business-name">
          Business Name
        </label>
        <input
          id="business-name"
          className="field-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label className="field-label" htmlFor="brand-color">
          Brand color
        </label>
        <div className="order-link-color-row">
          <input
            id="brand-color"
            className="field-input"
            value={brandColor}
            onChange={(event) => setBrandColor(event.target.value)}
            placeholder="#0f766e"
          />
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(brandColor) ? brandColor : "#0f766e"}
            className="order-link-color-picker"
            onChange={(event) => setBrandColor(event.target.value)}
            aria-label="Pick brand color"
          />
        </div>

        <label className="field-label" htmlFor="logo-url">
          Logo
        </label>
        <div className="order-link-upload-row">
          <input
            id="logo-url"
            className="field-input"
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="https://..."
          />
          <button
            type="button"
            className="button button-secondary"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? "Uploading..." : "Upload"}
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="order-link-hidden-input"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void uploadImage(file, "logo");
              event.currentTarget.value = "";
            }}
          />
        </div>

        <label className="field-label" htmlFor="banner-url">
          Banner photo
        </label>
        <div className="order-link-upload-row">
          <input
            id="banner-url"
            className="field-input"
            value={bannerPhotoUrl}
            onChange={(event) => setBannerPhotoUrl(event.target.value)}
            placeholder="https://..."
          />
          <button
            type="button"
            className="button button-secondary"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
          >
            {uploadingBanner ? "Uploading..." : "Upload"}
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="order-link-hidden-input"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void uploadImage(file, "banner");
              event.currentTarget.value = "";
            }}
          />
        </div>

        <label className="field-label" htmlFor="order-link-url">
          Order link
        </label>
        <input id="order-link-url" className="field-input" value={orderLinkUrl} readOnly />

        {message ? (
          <p className={`form-message ${messageType === "error" ? "form-message-error" : "form-message-success"}`}>
            {message}
          </p>
        ) : null}

        <div className="analytics-actions">
          <button className="button button-primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
