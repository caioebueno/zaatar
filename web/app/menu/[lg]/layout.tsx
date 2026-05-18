import PendingOrderAlert from "@/app/components/PendingOrderAlert";
import CustomerAuthSessionBootstrap from "@/app/components/CustomerAuthSessionBootstrap";
import { MenuProductsProvider } from "@/app/components/MenuProductsContext";
import MenuVisitTracker from "@/app/components/MenuVisitTracker";
import {
  MENU_ID_COOKIE_NAME,
  MENU_ID_HEADER_NAME,
  PROMOTION_ID_COOKIE_NAME,
  PROMOTION_ID_HEADER_NAME,
} from "@/src/constants/menu";
import { getProductsFresh } from "@/src/getProducts";
import { getOrderLinkSettings } from "@/src/getOrderLinkSettings";
import { cookies, headers } from "next/headers";
import type { CSSProperties } from "react";

const DEFAULT_BRAND_COLOR = "#142826";

function normalizeBrandColor(value: string): string {
  const normalized = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized)
    ? normalized
    : DEFAULT_BRAND_COLOR;
}

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
  const [products, orderLinkSettings] = await Promise.all([
    getProductsFresh(menuId, promotionId),
    getOrderLinkSettings(),
  ]);
  const brandColor = normalizeBrandColor(orderLinkSettings.brandColor);
  const productsWithSettings = {
    ...products,
    orderLinkSettings: {
      ...orderLinkSettings,
      brandColor,
    },
  };

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={
        {
          "--brandBackground": brandColor,
          "--color-brandBackground": brandColor,
        } as CSSProperties
      }
    >
      <style>{`
        :root {
          --brandBackground: ${brandColor};
          --color-brandBackground: ${brandColor};
        }
      `}</style>
      <MenuProductsProvider initialData={productsWithSettings}>
        <CustomerAuthSessionBootstrap />
        <MenuVisitTracker
          menuId={menuId}
          promotionId={promotionId}
          language={lg}
        />
        <PendingOrderAlert lg={lg} />
        <div className="flex-1">{children}</div>
      </MenuProductsProvider>
    </div>
  );
}
