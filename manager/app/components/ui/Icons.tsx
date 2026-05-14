import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconOrder(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M16 4v3h3" />
      <path d="M8 11h8M8 14h8M8 17h5" />
    </IconBase>
  );
}

export function IconDriver(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="7" cy="17" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
      <path d="M2.5 17H4M9.5 17h5M19.5 17H21" />
      <path d="M3 13l2-6h7l2 4h4l3 2" />
      <path d="M9 7v6" />
    </IconBase>
  );
}

export function IconClock(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function IconRoute(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M6 8c0 5 4 4 6 6s6 1 6 2" />
    </IconBase>
  );
}

export function IconKitchen(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 10c0-4 4-6 8-6s8 2 8 6" />
      <path d="M3 10h18v2H3z" />
      <path d="M5 12v8h14v-8" />
      <path d="M9 15v2M15 15v2" />
    </IconBase>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 3v18l2-1.5L10 21l2-1.5L14 21l2-1.5L18 21V3z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </IconBase>
  );
}

export function IconBell(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" />
      <path d="M10 21a2 2 0 004 0" />
    </IconBase>
  );
}

export function IconPin(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </IconBase>
  );
}

export function IconBolt(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </IconBase>
  );
}

export function IconStack(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
      <path d="M3 18l9 5 9-5" />
    </IconBase>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M10 18h4" />
    </IconBase>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 13l5 5L20 6" />
    </IconBase>
  );
}

export function IconCloudUpload(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 18a4 4 0 1 1 .5-7.97 6 6 0 0 1 11.5 1.97 3.5 3.5 0 0 1-.5 6.97" />
      <path d="M12 12v8" />
      <path d="M9 15l3-3 3 3" />
    </IconBase>
  );
}

export function IconImage(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-8 8" />
    </IconBase>
  );
}

export function IconX(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </IconBase>
  );
}

export function IconArrowDown(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4v15" />
      <path d="M6 13l6 6 6-6" />
    </IconBase>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 8v5" />
      <circle cx="12" cy="16.3" r="0.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconTriangleAlert(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" />
      <circle cx="12" cy="16.5" r="0.5" fill="currentColor" stroke="none" />
    </IconBase>
  );
}
