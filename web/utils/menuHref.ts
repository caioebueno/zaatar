"use client";

import { useSearchParams } from "next/navigation";
import { withMenuId } from "./withMenuId";

/** Builds menu links that keep the current URL's `menuId` (see `withMenuId`). */
export function useMenuHref(): (path: string) => string {
  const menuId = useSearchParams().get("menuId");
  return (path) => withMenuId(path, menuId);
}
