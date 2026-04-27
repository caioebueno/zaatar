"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const isFirstRender = useRef(true);
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParamsString]);

  return null;
}
