/**
 * `?menuId=` forces a menu for the request it is on, but the cookie it leaves
 * behind is shared by every tab. Carrying the param through the menu's own
 * links keeps each tab on the menu its URL asked for (e.g. two menus previewed
 * side by side from the manager). Without the param, links stay as they were
 * and the cookie decides. Server-safe; client components use `useMenuHref`.
 */
export function withMenuId(path: string, menuId: string | null | undefined): string {
  const id = menuId?.trim();
  if (!id) return path;
  return `${path}${path.includes("?") ? "&" : "?"}menuId=${encodeURIComponent(id)}`;
}
