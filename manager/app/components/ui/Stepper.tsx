import { IconCheck } from "./Icons";

export type StepStatus = "completed" | "active" | "upcoming";

export type Step = {
  id: string;
  label: string;
  meta?: string;
};

type StepperProps = {
  steps: Step[];
  activeIndex: number;
  showLabels?: boolean;
  vertical?: boolean;
};

// ── Constants ────────────────────────────────────────────────────────────────
const NODE = 32;
const CONNECTOR_THICKNESS = 2;
const CONNECTOR_LENGTH_V = 20; // vertical gap between nodes

function stepStatus(index: number, activeIndex: number): StepStatus {
  if (index < activeIndex) return "completed";
  if (index === activeIndex) return "active";
  return "upcoming";
}

const nodeStyle: Record<StepStatus, React.CSSProperties> = {
  completed: {
    background: "var(--ink)",
    border: "2px solid var(--ink)",
    color: "var(--cream)",
  },
  active: {
    background: "var(--zippy)",
    border: "2px solid var(--zippy)",
    color: "var(--paper)",
    boxShadow: "0 0 0 4px rgba(255,61,20,0.14)",
  },
  upcoming: {
    background: "var(--paper)",
    border: "2px solid var(--bone)",
    color: "var(--slate)",
  },
};

function StepNode({
  status,
  index,
}: {
  status: StepStatus;
  index: number;
}) {
  return (
    <div
      style={{
        width: NODE,
        height: NODE,
        borderRadius: NODE / 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background 200ms ease, box-shadow 200ms ease",
        ...nodeStyle[status],
      }}
      aria-current={status === "active" ? "step" : undefined}
    >
      {status === "completed" ? (
        <IconCheck size={14} color="var(--cream)" strokeWidth={2.4} />
      ) : (
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, lineHeight: 1 }}>
          {index + 1}
        </span>
      )}
    </div>
  );
}

// ── Horizontal layout (default) ──────────────────────────────────────────────

function HorizontalStepper({
  steps,
  activeIndex,
  showLabels,
}: {
  steps: Step[];
  activeIndex: number;
  showLabels: boolean;
}) {
  return (
    <div>
      {/* Node row */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {steps.map((step, i) => {
          const status = stepStatus(i, activeIndex);
          const isLast = i === steps.length - 1;
          return (
            <div key={step.id} style={{ display: "contents" }}>
              <StepNode status={status} index={i} />
              {!isLast && (
                <div
                  style={{
                    background: i < activeIndex ? "var(--ink)" : "var(--bone)",
                    height: CONNECTOR_THICKNESS,
                    flex: 1,
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Label row */}
      {showLabels && (
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 8 }}>
          {steps.map((step, i) => {
            const status = stepStatus(i, activeIndex);
            const isLast = i === steps.length - 1;
            return (
              <div key={step.id} style={{ display: "contents" }}>
                <div
                  style={{
                    width: NODE,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      textAlign: "center",
                      color:
                        status === "active"
                          ? "var(--zippy)"
                          : status === "completed"
                            ? "var(--ink)"
                            : "var(--slate)",
                      fontWeight: status === "active" ? 700 : 500,
                      whiteSpace: "nowrap",
                      lineHeight: 1.3,
                    }}
                  >
                    {step.label}
                  </div>
                  {step.meta && (
                    <div
                      className="mono"
                      style={{
                        fontSize: 9,
                        color: "var(--slate)",
                        textAlign: "center",
                        opacity: 0.8,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {step.meta}
                    </div>
                  )}
                </div>
                {!isLast && <div style={{ flex: 1 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Vertical layout ──────────────────────────────────────────────────────────

function VerticalStepper({
  steps,
  activeIndex,
  showLabels,
}: {
  steps: Step[];
  activeIndex: number;
  showLabels: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((step, i) => {
        const status = stepStatus(i, activeIndex);
        const isLast = i === steps.length - 1;
        return (
          <div key={step.id} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            {/* Left column: node + vertical connector */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <StepNode status={status} index={i} />
              {!isLast && (
                <div
                  style={{
                    width: CONNECTOR_THICKNESS,
                    height: CONNECTOR_LENGTH_V,
                    background: i < activeIndex ? "var(--ink)" : "var(--bone)",
                    borderRadius: 1,
                    margin: "3px 0",
                  }}
                />
              )}
            </div>

            {/* Right column: label + meta, vertically centered with the node */}
            {showLabels && (
              <div
                style={{
                  height: NODE,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 2,
                  paddingBottom: isLast ? 0 : CONNECTOR_LENGTH_V + 6,
                  minWidth: 0,
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color:
                      status === "active"
                        ? "var(--zippy)"
                        : status === "completed"
                          ? "var(--ink)"
                          : "var(--slate)",
                    fontWeight: status === "active" ? 700 : 500,
                    whiteSpace: "nowrap",
                    lineHeight: 1.3,
                  }}
                >
                  {step.label}
                </div>
                {step.meta && (
                  <div
                    className="mono"
                    style={{
                      fontSize: 9,
                      color: "var(--slate)",
                      opacity: 0.8,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.meta}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Public Stepper ───────────────────────────────────────────────────────────

export function Stepper({
  steps,
  activeIndex,
  showLabels = true,
  vertical = false,
}: StepperProps) {
  return vertical ? (
    <VerticalStepper steps={steps} activeIndex={activeIndex} showLabels={showLabels} />
  ) : (
    <HorizontalStepper steps={steps} activeIndex={activeIndex} showLabels={showLabels} />
  );
}

// ── Pre-built order lifecycle steppers ───────────────────────────────────────

export const DELIVERY_STEPS: Step[] = [
  { id: "accepted",   label: "Received" },
  { id: "preparing",  label: "Cooking"  },
  { id: "delivering", label: "Out"      },
  { id: "delivered",  label: "Done"     },
];

export const TAKEAWAY_STEPS: Step[] = [
  { id: "accepted",  label: "Received" },
  { id: "preparing", label: "Cooking"  },
  { id: "delivered", label: "Ready"    },
];

export const DELIVERY_INDEX: Record<string, number> = {
  ACCEPTED:   0,
  PREPARING:  1,
  DELIVERING: 2,
  DELIVERED:  3,
};

export const TAKEAWAY_INDEX: Record<string, number> = {
  ACCEPTED:  0,
  PREPARING: 1,
  DELIVERED: 2,
};
