"use client";

import { CartList } from "@/app/components/Price";
import { useMenuProducts } from "@/app/components/MenuProductsContext";

const CartPageContent: React.FC<{
  lg: string;
}> = ({ lg }) => {
  const data = useMenuProducts();

  return <CartList data={data} lg={lg} />;
};

export default CartPageContent;
