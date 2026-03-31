"use client";

import formatCurrency from "@/utils/formatCurrecy";
import { TGetProductsResponse } from "../../src/getProducts";
import TProduct from "../../src/types/product";
import TCategory from "../../src/types/category";
import DiscountModal from "./DiscountModal";
import { useState } from "react";
import CartBar from "./CartBar";
import ProductModal from "./ProductModal";
import { useCart } from "./CartContext";
import TCart, { TSelectedModifier } from "@/types/cart";
import { Button } from "@/components/ui/button";
import { FiInfo, FiMapPin } from "react-icons/fi";
import InformationModal from "./InformationModal";
import text from "@/constants/text";

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

  const { addItem, cart } = useCart();

  const content = text[lg];

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
      <div className="flex flex-col items-center w-full">
        <img
          src="/pizza.png"
          className="h-[160px] w-full object-cover"
          alt=""
        />
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
      <CategoryBar categories={data.categories} />
      <div className="px-4 pb-55 flex flex-col">
        {data.categories.map((category) => (
          <CategoryItem
            category={category}
            key={category.id}
            onProductSelect={setSelectedProductId}
            cart={cart}
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
  categories: TCategory[];
};

const CategoryBar: React.FC<TCategoryBar> = ({ categories }) => {
  return (
    <div className="flex flex-row border-gray-300 border-b w-full sticky top-0 bg-background overflow-x-auto">
      {categories.map((category) => (
        <CategoryBarItem key={category.id} category={category} />
      ))}
    </div>
  );
};

type TCategoryBarItem = {
  category: TCategory;
};

const CategoryBarItem: React.FC<TCategoryBarItem> = ({ category }) => {
  return (
    <a
      href={`#${category.id}`}
      className="py-3 px-4 font-bold text-lightText whitespace-nowrap"
    >
      {category.title}
    </a>
  );
};

type TCategoryItem = {
  category: TCategory;
  onProductSelect: (id: string) => void;
  cart: TCart;
  lg: string;
};

const CategoryItem: React.FC<TCategoryItem> = ({
  category,
  onProductSelect,
  cart,
  lg,
}) => {
  return (
    <a className="flex flex-col gap-4 pt-8" id={category.id}>
      <h2 className="text-[22px] font-bold">{category.title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {category.products.map((product) => (
          <ProductItem
            product={product}
            key={product.id}
            onProductSelect={onProductSelect}
            cart={cart}
            lg={lg}
          />
        ))}
      </div>
    </a>
  );
};

type TProductItem = {
  product: TProduct;
  onProductSelect: (id: string) => void;
  cart: TCart;
  lg: string;
};

const ProductItem: React.FC<TProductItem> = ({
  product,
  onProductSelect,
  cart,
  lg,
}) => {
  const firstImage =
    product.photos && product.photos[0] ? product.photos[0] : null;
  return (
    <div
      className="flex flex-col gap-3"
      onClick={() => onProductSelect(product.id)}
    >
      {firstImage && <img src={firstImage.url} className="rounded-2xl" />}
      <div className="flex flex-col">
        <span className="text-md font-semibold">
          {product.translations
            ? product.translations[lg]["title"] || product.name
            : product.name}
        </span>
        <div className="flex flex-row gap-2">
          {product.price && (
            <span className="font-extrabold">
              {formatCurrency(product.price)}
            </span>
          )}
          {product.comparedAtPrice && (
            <span className="font-semibold line-through">
              {formatCurrency(product.comparedAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
