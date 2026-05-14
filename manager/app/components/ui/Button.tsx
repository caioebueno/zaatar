import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ink" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children?: ReactNode;
};

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--zippy)", color: "var(--paper)", border: "1px solid transparent" },
  ink: { background: "var(--ink)", color: "var(--cream)", border: "1px solid transparent" },
  ghost: { background: "transparent", color: "var(--ink)", border: "1px solid rgba(22,18,15,0.2)" },
  danger: { background: "var(--paper)", color: "var(--ember)", border: "1px solid var(--ember)" },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "7px 12px", fontSize: 12, borderRadius: 6 },
  md: { padding: "10px 16px", fontSize: 14, borderRadius: 8 },
  lg: { padding: "14px 22px", fontSize: 16, borderRadius: 10 },
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        lineHeight: 1,
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
