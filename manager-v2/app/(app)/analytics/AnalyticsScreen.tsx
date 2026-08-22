"use client";

import { useState } from "react";
import { MetricSection } from "./MetricSection";
import { FeedbackSection } from "./FeedbackSection";
import { RetentionSection } from "./RetentionSection";
import { ReviewsDrawer } from "./ReviewsDrawer";

export function AnalyticsScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#F1F1F1", letterSpacing: "-0.2px" }}>Analytics</div>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
        <div>
          <MetricSection />
          <FeedbackSection onOpenReviews={() => setDrawerOpen(true)} />
          <RetentionSection />
        </div>
      </div>

      {drawerOpen && <ReviewsDrawer onClose={() => setDrawerOpen(false)} />}
    </>
  );
}
