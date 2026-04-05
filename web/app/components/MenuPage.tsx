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
import { forwardRef, useEffect, useRef, useState } from "react";
import CartBar from "./CartBar";
import ProductImage from "./ProductImage";
import ProductModal from "./ProductModal";
import { useCart } from "./CartContext";
import TCart, { TSelectedModifier } from "@/types/cart";
import { Button } from "@/components/ui/button";
import { FiInfo, FiMapPin } from "react-icons/fi";
import InformationModal from "./InformationModal";
import text from "@/constants/text";
import clsx from "clsx";

export function findProductById(
  categories: TCategory[],
  productId: string,
): TProduct | null {
  for (const category of categories) {
    const product = category.products.find((p) => p.id === productId);
    if (product) return product;
  }

  return null;
}

type TMenuPage = {
  data: TGetProductsResponse;
  lg: string;
};

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

  const content = text[lg];

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

  const selectedProduct = selectedProductId
    ? findProductById(data.categories, selectedProductId)
    : null;

  const addProduct = (
    productId: string,
    quantity: number,
    selectedModifiers: TSelectedModifier[],
    description?: string,
  ) => {
    addItem({
      productId,
      quantity,
      modifiers: selectedModifiers,
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
          <img
            src="/pizza.png"
            className="h-[160px] w-full object-cover"
            alt=""
          />
          {isBranchOpen !== null && (
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              <div
                className={`w-fit rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${
                  isBranchOpen ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {isBranchOpen ? content["open"] : content["closed"]}
              </div>
              {isBranchOpen === false && (
                <div className="w-fit rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white">
                  {content["orderForLater"]}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="rounded-xl border-[3px] border-white overflow-hidden w-fit  mt-[-60px] z-10">
          <img src="/logo.png" className="w-[100px] h-[100px]" alt="" />
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
            <Button className="flex-1 bg-foreground border-[#B0B7B6] border text-lightText text-sm py-2.5 font-semibold h-[36px]">
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
        {data.categories.map((category) => (
          <CategoryItem
            category={category}
            key={category.id}
            onProductSelect={setSelectedProductId}
            cart={cart}
            categories={data.categories}
            progressiveDiscount={data.progressiveDiscount}
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
        product={selectedProduct}
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
  lg: string;
};

const CategoryItem: React.FC<TCategoryItem> = ({
  category,
  onProductSelect,
  cart,
  categories,
  progressiveDiscount,
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
  lg: string;
};

const ProductItem: React.FC<TProductItem> = ({
  product,
  onProductSelect,
  cart,
  categories,
  progressiveDiscount,
  lg,
}) => {
  const firstImageUrl = product.photos?.[0]?.url ?? null;
  const pricePreview = calculateProductPriceWithProgressiveDiscount(
    product.id,
    progressiveDiscount,
    cart,
    categories,
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
