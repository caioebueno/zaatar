"use client";

import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

// ── Shared label ────────────────────────────────────────────────────────────
// Mono uppercase kicker, 10px, slate — matches ABButtons "Inputs" spec.

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 10,
        color: "var(--slate)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}
    >
      <label htmlFor={htmlFor}>{children}</label>
    </div>
  );
}

// ── Field hint / error message ───────────────────────────────────────────────

function FieldMessage({ error, hint }: { error?: string; hint?: string }) {
  if (error) {
    return (
      <div
        className="mono"
        style={{ fontSize: 10, color: "var(--ember)", letterSpacing: "0.06em", marginTop: 5 }}
      >
        {error}
      </div>
    );
  }
  if (hint) {
    return (
      <div
        className="mono"
        style={{ fontSize: 10, color: "var(--slate)", letterSpacing: "0.06em", marginTop: 5 }}
      >
        {hint}
      </div>
    );
  }
  return null;
}

// ── Base input styles ────────────────────────────────────────────────────────
// Two variants from the design:
//   "operational" → Geist Mono, cream bg — for times, IDs, counts
//   "default"     → Geist, paper bg    — for free text / notes

function inputStyle(variant: "default" | "operational", hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    border: hasError
      ? "1px solid var(--ember)"
      : "1px solid rgba(22,18,15,0.18)",
    borderRadius: 8,
    padding: "12px 14px",
    fontFamily: variant === "operational" ? "var(--font-mono)" : "var(--font-sans)",
    fontSize: 15,
    color: "var(--ink)",
    background: variant === "operational" ? "var(--cream)" : "var(--paper)",
    outline: "none",
    transition: "border-color 120ms ease, box-shadow 120ms ease",
    lineHeight: 1.4,
  };
}

// ── FormField — single-line input ────────────────────────────────────────────

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  variant?: "default" | "operational";
  error?: string;
  hint?: string;
};

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, variant = "default", error, hint, id, style, onFocus, onBlur, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    return (
      <div>
        <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
        <input
          ref={ref}
          id={fieldId}
          style={{ ...inputStyle(variant, !!error), ...style }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--ember)" : "var(--zippy)";
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 3px rgba(199,42,10,0.12)"
              : "0 0 0 3px rgba(255,61,20,0.12)";
            e.currentTarget.style.background = "var(--paper)";
            onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--ember)"
              : "rgba(22,18,15,0.18)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.background =
              variant === "operational" ? "var(--cream)" : "var(--paper)";
            onBlur?.(e);
          }}
          {...props}
        />
        <FieldMessage error={error} hint={hint} />
      </div>
    );
  },
);
FormField.displayName = "FormField";

// ── TextareaField — multi-line variant ──────────────────────────────────────

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  variant?: "default" | "operational";
  error?: string;
  hint?: string;
  rows?: number;
};

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    { label, variant = "default", error, hint, id, style, rows = 3, onFocus, onBlur, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    return (
      <div>
        <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          style={{
            ...inputStyle(variant, !!error),
            resize: "vertical",
            minHeight: 80,
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--ember)" : "var(--zippy)";
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 3px rgba(199,42,10,0.12)"
              : "0 0 0 3px rgba(255,61,20,0.12)";
            e.currentTarget.style.background = "var(--paper)";
            onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--ember)"
              : "rgba(22,18,15,0.18)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.background =
              variant === "operational" ? "var(--cream)" : "var(--paper)";
            onBlur?.(e);
          }}
          {...props}
        />
        <FieldMessage error={error} hint={hint} />
      </div>
    );
  },
);
TextareaField.displayName = "TextareaField";

// ── SelectField ──────────────────────────────────────────────────────────────

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, id, style, onFocus, onBlur, children, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    return (
      <div>
        <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
        <select
          ref={ref}
          id={fieldId}
          style={{
            ...inputStyle("default", !!error),
            cursor: "pointer",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%236c6259' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
            paddingRight: 36,
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--ember)" : "var(--zippy)";
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 3px rgba(199,42,10,0.12)"
              : "0 0 0 3px rgba(255,61,20,0.12)";
            onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--ember)"
              : "rgba(22,18,15,0.18)";
            e.currentTarget.style.boxShadow = "none";
            onBlur?.(e);
          }}
          {...props}
        >
          {children}
        </select>
        <FieldMessage error={error} hint={hint} />
      </div>
    );
  },
);
SelectField.displayName = "SelectField";
