"use client";

import {
  MENU_VISIT_KEYS_COOKIE_NAME,
  MENU_VISITOR_ID_COOKIE_NAME,
} from "@/src/constants/menu";
import { useEffect } from "react";

type MenuVisitTrackerProps = {
  menuId: string | null;
  promotionId: string | null;
  language: string;
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const MAX_STORED_VISIT_KEYS = 50;

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const cookieParts = document.cookie.split(";");

  for (const part of cookieParts) {
    const trimmedPart = part.trim();
    if (trimmedPart.startsWith(encodedName)) {
      return decodeURIComponent(trimmedPart.slice(encodedName.length));
    }
  }

  return null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function readSeenVisitKeys(): string[] {
  const raw = getCookieValue(MENU_VISIT_KEYS_COOKIE_NAME);
  if (!raw) {
    return [];
  }

  return raw
    .split("|")
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

function buildVisitKey(input: {
  menuId: string | null;
  promotionId: string | null;
  language: string;
}): string {
  return `menu:${input.menuId ?? "default"};promotion:${input.promotionId ?? "none"};lang:${input.language}`;
}

function generateVisitorId(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

const MenuVisitTracker: React.FC<MenuVisitTrackerProps> = ({
  menuId,
  promotionId,
  language,
}) => {
  useEffect(() => {
    const visitKey = buildVisitKey({ menuId, promotionId, language });
    const seenVisitKeys = readSeenVisitKeys();

    if (seenVisitKeys.includes(visitKey)) {
      return;
    }

    const existingVisitorId = getCookieValue(MENU_VISITOR_ID_COOKIE_NAME);
    const visitorId = existingVisitorId || generateVisitorId();

    const pathname =
      typeof window !== "undefined" ? window.location.pathname : `/menu/${language}`;
    const referrer =
      typeof document !== "undefined" && document.referrer
        ? document.referrer
        : null;

    void fetch("/api/menu-analytics/visits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId,
        visitKey,
        menuId,
        promotionId,
        language,
        pathname,
        referrer,
      }),
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          console.warn(
            `MENU_VISIT_TRACKING_FAILED status=${response.status} body=${errorBody}`,
          );
          return;
        }

        const nextSeenVisitKeys = Array.from(
          new Set([...seenVisitKeys, visitKey]),
        ).slice(-MAX_STORED_VISIT_KEYS);

        setCookie(MENU_VISITOR_ID_COOKIE_NAME, visitorId);
        setCookie(MENU_VISIT_KEYS_COOKIE_NAME, nextSeenVisitKeys.join("|"));
      })
      .catch((error) => {
        console.warn("MENU_VISIT_TRACKING_REQUEST_FAILED", error);
      });
  }, [language, menuId, promotionId]);

  return null;
};

export default MenuVisitTracker;
