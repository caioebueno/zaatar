"use client";

import MenuPage from "@/app/components/MenuPage";
import { useMenuProducts } from "@/app/components/MenuProductsContext";

const MenuPageContent: React.FC<{
  lg: string;
}> = ({ lg }) => {
  const data = useMenuProducts();

  return <MenuPage data={data} lg={lg} />;
};

export default MenuPageContent;
