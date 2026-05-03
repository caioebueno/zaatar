"use client";

import { DEFAULT_BRANCH_ID } from "@/constants/branch";
import formatCurrency from "@/utils/formatCurrecy";
import { calculateProductPriceWithProgressiveDiscount } from "@/utils/calculateProductPriceWithProgressiveDiscount";
import { isOperationHoursOpenAt } from "@/src/modules/branch/domain/branch.types";
import type { TOperationHours } from "@/src/types/operationHours";
import { TGetProductsResponse } from "../../src/getProducts";
import TProduct from "../../src/types/product";
import TCategory from "../../src/types/category";
import TProgressiveDiscount from "../../src/types/progressiveDiscount";
import DiscountModal from "./DiscountModal";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import CartBar from "./CartBar";
import ProductImage from "./ProductImage";
import ProductModal from "./ProductModal";
import { useCart } from "./CartContext";
import TCart, {
  TSelectedComboSlotOption,
  TSelectedModifier,
} from "@/types/cart";
import { Button } from "@/components/ui/button";
import { FiInfo, FiMapPin } from "react-icons/fi";
import InformationModal from "./InformationModal";
import text from "@/constants/text";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

const ADDRESS_MAPS_URL = "https://maps.app.goo.gl/daqTiXJTTGwVeH4Z6";

export function findProductById(
  categories: TCategory[],
  productId: string,
  additionalProducts?: TProduct[],
): TProduct | null {
  for (const category of categories) {
    const product = category.products.find((p) => p.id === productId);
    if (product) return product;
  }

  const fallbackProduct = additionalProducts?.find((p) => p.id === productId);
  if (fallbackProduct) return fallbackProduct;

  return null;
}

type TMenuPage = {
  data: TGetProductsResponse;
  lg: string;
};

type PromotionProductPreview = {
  id: string;
  product: TProduct;
  categoryId: string;
};

function getProductTitle(product: TProduct, lg: string): string {
  if (product.translations?.[lg]?.title) {
    return product.translations[lg].title as string;
  }

  if (product.translations?.en?.title) {
    return product.translations.en.title as string;
  }

  return product.name;
}

const MenuPage: React.FC<TMenuPage> = ({ data, lg }) => {
  const [openDiscountModal, setOpenDiscountModal] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<null | string>(
    null,
  );
  const [openInformationModal, setOpenInformationModal] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState<boolean | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    data.categories[0]?.id ?? null,
  );
  const categoryBarRef = useRef<HTMLDivElement | null>(null);

  const { addItem, cart } = useCart();

  const content = text[lg] || text["en"];
  const languageOptions = [
    {
      code: "en",
      label: "EN",
      flagSrc: "/us.svg",
      flagAlt: "United States flag",
    },
    {
      code: "pt",
      label: "PT",
      flagSrc: "/portuguese.svg",
      flagAlt: "Brazil flag",
    },
    {
      code: "es",
      label: "ES",
      flagSrc: "/spanish.svg",
      flagAlt: "Spanish flag",
    },
  ];

  useEffect(() => {
    const controller = new AbortController();

    const loadOperationHours = async () => {
      try {
        const response = await fetch(
          `/api/branches/${DEFAULT_BRANCH_ID}/working-hours`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) return;

        const data = (await response.json()) as {
          operationHours?: TOperationHours;
        };

        if (data.operationHours) {
          setIsBranchOpen(isOperationHoursOpenAt(data.operationHours, new Date()));
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    };

    loadOperationHours();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (data.categories.length === 0) return;

    const updateActiveCategory = () => {
      const viewportHeight = window.innerHeight;
      const topInset = categoryBarRef.current?.getBoundingClientRect().bottom ?? 0;

      let nextActiveCategoryId = data.categories[0]?.id ?? null;
      let maxVisibleHeight = -1;

      for (const category of data.categories) {
        const element = document.getElementById(category.id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const visibleHeight =
          Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, topInset);
        const clampedVisibleHeight = Math.max(0, visibleHeight);

        if (clampedVisibleHeight > maxVisibleHeight) {
          maxVisibleHeight = clampedVisibleHeight;
          nextActiveCategoryId = category.id;
        }
      }

      setActiveCategoryId(nextActiveCategoryId);
    };

    updateActiveCategory();

    window.addEventListener("scroll", updateActiveCategory, { passive: true });
    window.addEventListener("resize", updateActiveCategory);

    return () => {
      window.removeEventListener("scroll", updateActiveCategory);
      window.removeEventListener("resize", updateActiveCategory);
    };
  }, [data.categories]);

  const promotionLabelByLocale: Record<string, { title: string; eyebrow: string }> = {
    en: {
      title: "Promotions",
      eyebrow: "Exclusive Promotion",
    },
    pt: {
      title: "Promoções",
      eyebrow: "Promoção Exclusiva",
    },
    es: {
      title: "Promociones",
      eyebrow: "Promoción Exclusiva",
    },
  };
  const promotionLabel = promotionLabelByLocale[lg] ?? promotionLabelByLocale.en;
  const exclusiveDealProductIdSet = useMemo(
    () =>
      new Set([
        ...(data.promotionProductIds ?? []),
        ...(data.activePromotion?.products?.map((product) => product.id) ?? []),
      ]),
    [data.promotionProductIds, data.activePromotion?.products],
  );
  const promotionProducts = useMemo(() => {
    if (!data.activePromotion?.products?.length) {
      return [];
    }

    const uniqueByProductId = new Map<string, PromotionProductPreview>();
    const categoryByProductId = new Map<string, string>();

    for (const category of data.categories) {
      for (const product of category.products) {
        categoryByProductId.set(product.id, category.id);
      }
    }

    for (const product of data.activePromotion.products) {
      if (uniqueByProductId.has(product.id)) continue;
      const categoryId = categoryByProductId.get(product.id) ?? "";

      uniqueByProductId.set(product.id, {
        id: product.id,
        product,
        categoryId,
      });
    }

    return Array.from(uniqueByProductId.values()).slice(0, 12);
  }, [data.activePromotion, data.categories]);

  const promotionSectionTitle = data.activePromotion?.name ?? promotionLabel.title;
  const selectedProduct = selectedProductId
    ? findProductById(
      data.categories,
      selectedProductId,
      data.activePromotion?.products,
    )
    : null;
  const selectedProductIsExclusiveDeal = selectedProduct
    ? exclusiveDealProductIdSet.has(selectedProduct.id)
    : false;

  const addProduct = (
    productId: string,
    quantity: number,
    selectedModifiers: TSelectedModifier[],
    comboSelections: TSelectedComboSlotOption[],
    description?: string,
  ) => {
    addItem({
      productId,
      quantity,
      modifiers: selectedModifiers,
      comboSelections,
      description: description,
    });
    setSelectedProductId(null);
  };

  return (
    <>
      <InformationModal
        open={openInformationModal}
        onOpenChange={setOpenInformationModal}
        content={content}
      />
      <div className="flex flex-col items-center w-full max-w-[900px]">
        <div className="relative w-full">
          <Image
            src="/pizza.png"
            width={1800}
            height={320}
            priority
            sizes="(max-width: 900px) 100vw, 900px"
            className="h-[160px] w-full object-cover"
            alt=""
          />
          <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-black/10 bg-white/90 p-1 shadow-sm backdrop-blur">
            {languageOptions.map((language) => {
              const active = lg === language.code;

              return (
                <Link
                  key={language.code}
                  href={`/menu/${language.code}`}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors",
                    active
                      ? "bg-[#142826] text-white"
                      : "text-[#142826] hover:bg-[#E8EFEE]",
                  )}
                >
                  <Image
                    src={language.flagSrc}
                    width={16}
                    height={12}
                    alt={language.flagAlt}
                    className="rounded-[2px]"
                  />
                  <span>{language.label}</span>
                </Link>
              );
            })}
          </div>
          {isBranchOpen !== null && (
            <div className="absolute left-4 top-4 flex flex-col gap-0">
              <div
                className={`w-fit rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${
                  isBranchOpen ? "bg-green-600" : "bg-red-600 rounded-b-none rounded-t-xl w-full flex justify-center items-center"
                }`}
              >
                {isBranchOpen ? content["open"] : content["closed"]}
              </div>
              {isBranchOpen === false && (
                <div className="w-fit rounded-b-xl rounded-t-none bg-black/65 px-3 py-1.5 text-xs font-semibold text-white">
                  {content["orderForLater"]}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="rounded-xl border-[3px] border-white overflow-hidden w-fit  mt-[-60px] z-10">
          <Image
            src="/logo.png"
            width={100}
            height={100}
            priority
            className="w-[100px] h-[100px]"
            alt=""
          />
        </div>
        <div className="flex flex-col gap-4 pt-4 w-full items-center p-4">
          <h1 className="text-[32px] font-bold">Zaatar Grill & Pizza</h1>
          <div className="flex flex-row w-full gap-3">
            <Button
              onClick={() => setOpenInformationModal(true)}
              className="flex-1 bg-foreground border-[#B0B7B6] border text-lightText text-sm py-2.5 font-semibold h-[36px]"
            >
              <FiInfo />
              {content["information"]}
            </Button>
            <Button
              onClick={() =>
                window.open(ADDRESS_MAPS_URL, "_blank", "noopener,noreferrer")
              }
              className="flex-1 bg-foreground border-[#B0B7B6] border text-lightText text-sm py-2.5 font-semibold h-[36px]"
            >
              <FiMapPin />
              {content["address"]}
            </Button>
          </div>
        </div>
      </div>
      <CategoryBar
        activeCategoryId={activeCategoryId}
        categories={data.categories}
        containerRef={categoryBarRef}
        lg={lg}
        onCategorySelect={setActiveCategoryId}
      />
      <div className="px-4 pb-55 flex flex-col max-w-[900px] lg:px-0">
        {promotionProducts.length > 0 && (
          <section className="pt-6 -mx-4 lg:mx-0">
            <div className="rounded-none bg-transparent px-4 text-[#0f2722] md:px-0">
              <div className="flex flex-col gap-1 items-center">
                <p className="text-xl font-bold text-white bg-brandBackground w-fit px-3 py-1.5 rounded-xl">
                  {promotionLabel.eyebrow}
                </p>
                {/* <div>
                  <h2 className="text-[24px] font-black tracking-[-0.02em]">
                    {promotionSectionTitle}
                  </h2>
                </div> */}
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 md:gap-4 md:grid md:grid-cols-2">
                {promotionProducts.map((promotionProduct) => {
                  const product = promotionProduct.product;
                  const productTitle = getProductTitle(product, lg);
                  const displayPrice =
                    typeof product.price === "number" ? product.price : null;
                  const strikePrice = product.comparedAtPrice ?? null;

                  return (
                    <button
                      key={promotionProduct.id}
                      type="button"
                      onClick={() => setSelectedProductId(promotionProduct.id)}
                      className="group relative w-full snap-start overflow-hidden rounded-2xl bg-[#e8efee] text-left text-[#0f2722]"
                    >
                      <ProductImage
                        src={product.photos?.[0]?.url ?? null}
                        className="aspect-[16/7] w-full object-cover bg-[#d8dfdc]"
                        alt={productTitle}
                        quality={45}
                        sizes="(max-width: 768px) 230px, 230px"
                      />
                      <div className="p-3">
                        <p className="line-clamp-1 text-base font-bold">{productTitle}</p>
                        <div className="mt-1 flex items-center gap-2">
                          {displayPrice !== null && (
                            <span className="text-xl font-black">
                              {formatCurrency(displayPrice)}
                            </span>
                          )}
                          {strikePrice !== null && displayPrice !== null && strikePrice > displayPrice && (
                            <span className="text-sm font-semibold text-[#5a6a66] line-through">
                              {formatCurrency(strikePrice)}
                            </span>
                          )}
                        </div>
                        {/* <p className="mt-1 text-xs font-semibold text-[#2f6a5b]">
                          Tap to select
                        </p> */}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {data.categories.map((category) => (
          <CategoryItem
            category={category}
            key={category.id}
            onProductSelect={setSelectedProductId}
            cart={cart}
            categories={data.categories}
            progressiveDiscount={data.progressiveDiscount}
            promotionProductIds={data.promotionProductIds}
            lg={lg}
          />
        ))}
        {data.progressiveDiscount && (
          <DiscountModal
            progressiveDiscount={data.progressiveDiscount}
            onOpenChange={setOpenDiscountModal}
            open={openDiscountModal}
            content={content}
          />
        )}
      </div>
      <CartBar
        data={data}
        onLearnMoreClick={() => setOpenDiscountModal(true)}
        content={content}
        lg={lg}
      />
      <ProductModal
        key={selectedProduct?.id ?? "none"}
        product={selectedProduct}
        isExclusiveDeal={selectedProductIsExclusiveDeal}
        onClose={() => setSelectedProductId(null)}
        onAdd={addProduct}
        content={content}
        lg={lg}
      />
    </>
  );
};

type TCategoryBar = {
  activeCategoryId: string | null;
  categories: TCategory[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  lg: string;
  onCategorySelect: (categoryId: string) => void;
};

const CategoryBar: React.FC<TCategoryBar> = ({
  activeCategoryId,
  categories,
  containerRef,
  lg,
  onCategorySelect,
}) => {
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    if (!activeCategoryId) return;

    const container = containerRef.current;
    const activeItem = itemRefs.current[activeCategoryId];

    if (!container || !activeItem) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const nextScrollLeft =
      container.scrollLeft +
      (itemRect.left - containerRect.left) -
      (containerRect.width / 2 - itemRect.width / 2);

    container.scrollTo({
      left: Math.max(0, nextScrollLeft),
      behavior: "smooth",
    });
  }, [activeCategoryId, containerRef]);

  return (
    <>
      <div
        ref={containerRef}
        className="category-bar-scroll flex flex-row border-gray-300 border-b w-full sticky top-[var(--menu-sticky-offset)] bg-background overflow-x-auto max-w-[900px] z-10"
      >
        {categories.map((category) => (
          <CategoryBarItem
            active={activeCategoryId === category.id}
            category={category}
            key={category.id}
            lg={lg}
            onSelect={onCategorySelect}
            ref={(element) => {
              itemRefs.current[category.id] = element;
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @media (max-width: 1023px) {
          .category-bar-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .category-bar-scroll::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

type TCategoryBarItem = {
  active: boolean;
  category: TCategory;
  lg: string;
  onSelect: (categoryId: string) => void;
};

const CategoryBarItem = forwardRef<HTMLAnchorElement, TCategoryBarItem>(
  ({ active, category, lg, onSelect }, ref) => {
    return (
      <a
        ref={ref}
        href={`#${category.id}`}
        onClick={() => onSelect(category.id)}
        className={clsx(
          "py-3 px-4 font-bold whitespace-nowrap border-b-2 transition-colors",
          active
            ? "text-brandBackground border-brandBackground"
            : "text-lightText border-transparent",
        )}
      >
        {category.translations?.[lg]?.title ??
          category.title}
      </a>
    );
  },
);

CategoryBarItem.displayName = "CategoryBarItem";

type TCategoryItem = {
  category: TCategory;
  onProductSelect: (id: string) => void;
  cart: TCart;
  categories: TCategory[];
  progressiveDiscount: TProgressiveDiscount | null;
  promotionProductIds?: string[];
  lg: string;
};

const CategoryItem: React.FC<TCategoryItem> = ({
  category,
  onProductSelect,
  cart,
  categories,
  progressiveDiscount,
  promotionProductIds,
  lg,
}) => {
  const categoryTitle =
    category.translations?.[lg]?.title ||
    category.translations?.["en"]?.title ||
    category.title;

  return (
    <section className="flex flex-col gap-4 pt-8" id={category.id}>
      <h2 className="text-[22px] font-bold">{categoryTitle}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {category.products.map((product) => (
          <ProductItem
            product={product}
            key={product.id}
            onProductSelect={onProductSelect}
            cart={cart}
            categories={categories}
            progressiveDiscount={progressiveDiscount}
            promotionProductIds={promotionProductIds}
            lg={lg}
          />
        ))}
      </div>
    </section>
  );
};

type TProductItem = {
  product: TProduct;
  onProductSelect: (id: string) => void;
  cart: TCart;
  categories: TCategory[];
  progressiveDiscount: TProgressiveDiscount | null;
  promotionProductIds?: string[];
  lg: string;
};

const ProductItem: React.FC<TProductItem> = ({
  product,
  onProductSelect,
  cart,
  categories,
  progressiveDiscount,
  promotionProductIds,
  lg,
}) => {
  const firstImageUrl = product.photos?.[0]?.url ?? null;
  const pricePreview = calculateProductPriceWithProgressiveDiscount(
    product.id,
    progressiveDiscount,
    cart,
    categories,
    undefined,
    promotionProductIds,
  );
  const displayPrice =
    pricePreview?.discountedPrice ??
    (typeof product.price === "number" ? product.price : null);
  const strikePrice =
    pricePreview &&
    typeof pricePreview.actualPrice === "number" &&
    pricePreview.discountedPrice < pricePreview.actualPrice
      ? pricePreview.actualPrice
      : product.comparedAtPrice ?? null;

  return (
    <div
      className="flex flex-col gap-3"
      onClick={() => onProductSelect(product.id)}
    >
      <ProductImage
        src={firstImageUrl}
        className="rounded-2xl aspect-square object-cover bg-foreground"
        alt={product.name}
        quality={45}
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
      />
      <div className="flex flex-col gap-1">
        <span className="text-md font-semibold leading-4.5">
          {product.translations
            ? product.translations[lg] && product.translations[lg]["title"] || product.name
            : product.name}
        </span>
        <div className="flex flex-row gap-2">
          {displayPrice !== null && (
            <span className="font-extrabold">
              {formatCurrency(displayPrice)}
            </span>
          )}
          {strikePrice !== null && strikePrice > displayPrice! && (
            <span className="font-semibold line-through">
              {formatCurrency(strikePrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
