export const dynamic = "force-dynamic";
import prisma from "@/prisma";
import PromotionManager from "@/app/components/PromotionManager";
import type {
  ExclusivePromotionWeekday,
  ProductItemType,
} from "@/src/generated/prisma";

type PromotionRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  active: boolean;
  expireAt: string | null;
  validWeekdays: ExclusivePromotionWeekday[];
  productIds: string[];
};

type ProductOption = {
  id: string;
  name: string;
  itemType: ProductItemType;
  visible: boolean;
};

export default async function PromotionPage() {
  const [promotions, products] = await Promise.all([
    prisma.exclusivePromotion.findMany({
      include: {
        products: {
          select: {
            productId: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        itemType: true,
        visible: true,
      },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const initialPromotions: PromotionRecord[] = promotions.map((promotion) => ({
    id: promotion.id,
    createdAt: promotion.createdAt.toISOString(),
    updatedAt: promotion.updatedAt.toISOString(),
    name: promotion.name,
    active: promotion.active,
    expireAt: promotion.expireAt ? promotion.expireAt.toISOString() : null,
    validWeekdays: promotion.validWeekdays,
    productIds: promotion.products.map((product) => product.productId),
  }));

  const productOptions: ProductOption[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    itemType: product.itemType,
    visible: product.visible,
  }));

  return (
    <PromotionManager
      initialPromotions={initialPromotions}
      products={productOptions}
    />
  );
}
