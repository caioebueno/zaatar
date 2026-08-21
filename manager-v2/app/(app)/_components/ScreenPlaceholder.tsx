export function ScreenPlaceholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "#D0D1D3" }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#75767C", maxWidth: 320, lineHeight: 1.5 }}>{subtitle}</div>
    </div>
  );
}
