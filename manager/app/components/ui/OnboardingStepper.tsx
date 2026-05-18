"use client";

import { IconCheck } from "./Icons";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StepDef = {
  readonly id: string;
  readonly label: string;
  readonly sub: string;
};

// ── Primitives ────────────────────────────────────────────────────────────────

export function StepNode({ state }: { state: "done" | "active" | "upcoming" }) {
  const cfg = {
    done:     { bg: "#00a866", border: "#00a866" },
    active:   { bg: "#ff3d14", border: "#ff3d14" },
    upcoming: { bg: "var(--paper)", border: "rgba(22,18,15,0.18)" },
  }[state];

  return (
    <div
      style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: cfg.bg, border: `1.5px solid ${cfg.border}`,
        display: "grid", placeItems: "center",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      {state === "done" ? (
        <IconCheck size={13} color="#fff" strokeWidth={2.4} />
      ) : (
        <div style={{
          width: 8, height: 8, borderRadius: 2,
          background: state === "active" ? "#fff" : "var(--slate)",
          opacity: state === "active" ? 1 : 0.35,
        }} />
      )}
    </div>
  );
}

export function StepConnector({ done }: { done: boolean }) {
  return (
    <div style={{ width: 28, display: "flex", justifyContent: "center", margin: "2px 0" }}>
      <div style={{
        width: 2, height: 16, borderRadius: 1,
        background: done ? "#00a866" : "rgba(22,18,15,0.1)",
        transition: "background 0.2s",
      }} />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  steps: readonly StepDef[];
  stepDone: boolean[];
  currentStep: number;
  onStepChange: (index: number) => void;
};

export function OnboardingStepper({ steps, stepDone, currentStep, onStepChange }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((step, i) => {
        const state: "done" | "active" | "upcoming" = i === currentStep
          ? "active"
          : stepDone[i]
            ? "done"
            : "upcoming";
        const isLast = i === steps.length - 1;

        return (
          <div key={step.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onStepChange(i)}
              onKeyDown={(e) => e.key === "Enter" && onStepChange(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
                padding: "4px 0",
                outline: "none",
              }}
            >
              <StepNode state={state} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <div style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: state === "active" ? 600 : 500,
                    fontSize: 14,
                    letterSpacing: "-0.01em",
                    color: state === "upcoming" ? "var(--slate)" : "var(--ink)",
                    transition: "color 0.2s",
                  }}>
                    {step.label}
                  </div>
                  {stepDone[i] && (
                    <div className="mono" style={{ fontSize: 10, color: "#00a866", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, flexShrink: 0 }}>
                      Done
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 1 }}>
                  {step.sub}
                </div>
              </div>
            </div>

            {!isLast && <StepConnector done={stepDone[i]} />}
          </div>
        );
      })}
    </div>
  );
}
