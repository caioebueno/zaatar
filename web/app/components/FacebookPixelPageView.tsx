"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackFacebookPixelEvent } from "@/app/lib/facebookPixel";

export default function FacebookPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    trackFacebookPixelEvent("PageView");
  }, [pathname, searchParamsString]);

  return null;
}
