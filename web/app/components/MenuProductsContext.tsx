"use client";

import { TGetProductsResponse } from "@/src/getProducts";
import { ReactNode, createContext, useContext, useState } from "react";

const MenuProductsContext = createContext<TGetProductsResponse | null>(null);

export const MenuProductsProvider: React.FC<{
  initialData: TGetProductsResponse;
  children: ReactNode;
}> = ({ initialData, children }) => {
  const [data] = useState(initialData);

  return (
    <MenuProductsContext.Provider value={data}>
      {children}
    </MenuProductsContext.Provider>
  );
};

export const useMenuProducts = (): TGetProductsResponse => {
  const context = useContext(MenuProductsContext);

  if (!context) {
    throw new Error(
      "useMenuProducts must be used within a MenuProductsProvider",
    );
  }

  return context;
};
