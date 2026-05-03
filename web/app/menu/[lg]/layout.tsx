import PendingOrderAlert from "@/app/components/PendingOrderAlert";
import { MenuProductsProvider } from "@/app/components/MenuProductsContext";
import {
  MENU_ID_COOKIE_NAME,
  MENU_ID_HEADER_NAME,
  PROMOTION_ID_COOKIE_NAME,
  PROMOTION_ID_HEADER_NAME,
} from "@/src/constants/menu";
import { getProductsFresh } from "@/src/getProducts";
import { cookies, headers } from "next/headers";

export default async function MenuLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{
    lg: string;
  }>;
}>) {
  const { lg } = await params;
  const requestHeaders = await headers();
  const headerMenuId = requestHeaders.get(MENU_ID_HEADER_NAME);
  const headerPromotionId = requestHeaders.get(PROMOTION_ID_HEADER_NAME);
  const cookieStore = await cookies();
  const rawMenuId = cookieStore.get(MENU_ID_COOKIE_NAME)?.value;
  const rawPromotionId = cookieStore.get(PROMOTION_ID_COOKIE_NAME)?.value;
  const resolvedMenuId = headerMenuId ?? rawMenuId;
  const resolvedPromotionId = headerPromotionId ?? rawPromotionId;
  const menuId =
    typeof resolvedMenuId === "string" && resolvedMenuId.trim().length > 0
      ? resolvedMenuId.trim()
      : null;
  const promotionId =
    typeof resolvedPromotionId === "string" &&
    resolvedPromotionId.trim().length > 0
      ? resolvedPromotionId.trim()
      : null;
  const products = await getProductsFresh(menuId, promotionId);

  return (
    <div className="min-h-dvh flex flex-col">
      <MenuProductsProvider initialData={products}>
        <PendingOrderAlert lg={lg} />
        <div className="flex-1">{children}</div>
      </MenuProductsProvider>
    </div>
  );
}
