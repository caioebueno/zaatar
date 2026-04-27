"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type FbqTrackFunction = (
  command: "track",
  eventName: string,
  ...parameters: unknown[]
) => void;

declare global {
  interface Window {
    fbq?: FbqTrackFunction;
  }
}

export default function FacebookPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    let cancelled = false;

    const tryTrack = (attempt: number) => {
      if (cancelled) return;

      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
        return;
      }

      if (attempt >= 15) return;

      window.setTimeout(() => {
        tryTrack(attempt + 1);
      }, 200);
    };

    tryTrack(0);

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParamsString]);

  return null;
}
