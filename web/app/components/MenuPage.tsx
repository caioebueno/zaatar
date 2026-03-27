"use client"

import formatCurrency from "@/utils/formatCurrecy"
import { TGetProductsResponse } from "../../../src/getProducts"
import TProduct from "../../../src/types/product"
import TCategory from "../../../src/types/category"
import DiscountModal from "./DiscountModal"
import { useState } from "react"
import CartBar from "./CartBar"
import ProductModal from "./ProductModal"
import { useCart } from "./CartContext"
import TCart from "@/types/cart"

export function findProductById(
  categories: TCategory[],
  productId: string
): TProduct | null {
  for (const category of categories) {
    const product = category.products.find((p) => p.id === productId);
    if (product) return product;
  }

  return null;
}

type TMenuPage = {
  data: TGetProductsResponse
}

const MenuPage: React.FC<TMenuPage> = ({
  data
}) => {
  const [openDiscountModal, setOpenDiscountModal] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<null | string>(null)

  const { addItem, cart } = useCart()

  const selectedProduct = selectedProductId ? findProductById(data.categories, selectedProductId) : null

  const addProduct = (productId: string, quantity: number) => {
    addItem({
      productId,
      quantity
    })
    setSelectedProductId(null)
  }

  return (
    <>
      <CategoryBar categories={data.categories} />
      <div className="px-4 pb-55 flex flex-col">
        {data.categories.map(category => (
          <CategoryItem category={category} key={category.id} onProductSelect={setSelectedProductId} cart={cart} />
        ))}
        {data.progressiveDiscount && (
          <DiscountModal
            progressiveDiscount={data.progressiveDiscount}
            onOpenChange={setOpenDiscountModal}
            open={openDiscountModal}
          />
        )}
      </div>
      <CartBar
        data={data}
      />
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProductId(null)}
        onAdd={addProduct}
      />
    </>
  )
}

type TCategoryBar = {
  categories: TCategory[]
}

const CategoryBar: React.FC<TCategoryBar> = ({
  categories
}) => {
  return (
    <div className="flex flex-row shadow w-full sticky top-0 bg-background">
      {categories.map(category => (
        <CategoryBarItem
          key={category.id}
          category={category}
        />
      ))}
    </div>
  )
}

type TCategoryBarItem = {
  category: TCategory
}

const CategoryBarItem: React.FC<TCategoryBarItem> = ({
  category
}) => {
  return (
    <a href={`#${category.id}`} className="py-3 px-4 font-bold text-lightText">{category.title}</a>
  )
}

type TCategoryItem = {
  category: TCategory
  onProductSelect: (id: string) => void
  cart: TCart
}

const CategoryItem: React.FC<TCategoryItem> = ({
  category,
  onProductSelect,
  cart
}) => {
  return (
    <a className="flex flex-col gap-4 pt-8" id={category.id}>
      <h2 className="text-[22px] font-bold">{category.title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {category.products.map(product => (
          <ProductItem
          product={product}
          key={product.id}
          onProductSelect={onProductSelect}
          cart={cart}
          />
        ))}
      </div>
    </a>
  )
}

type TProductItem = {
  product: TProduct
   onProductSelect: (id: string) => void
   cart: TCart
}

const ProductItem: React.FC<TProductItem> = ({
  product,
  onProductSelect,
  cart
}) => {
  const firstImage = product.photos && product.photos[0] ?  product.photos[0] : null
  return (
    <div className="flex flex-col gap-3" onClick={() => onProductSelect(product.id)}>
      {firstImage && (
        <img src={firstImage.url} className="rounded-2xl" />
      )}
      <div className="flex flex-col">
        <span className="text-md font-semibold">{product.name}</span>
        <div className="flex flex-row gap-2">
          {product.price && <span className="font-extrabold">{formatCurrency(product.price)}</span>}
          {product.comparedAtPrice && <span className="font-semibold line-through">{formatCurrency(product.comparedAtPrice)}</span>}
        </div>
      </div>
    </div>
  )
}

export default MenuPage
