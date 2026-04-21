import PendingOrderAlert from "@/app/components/PendingOrderAlert";
import { MenuProductsProvider } from "@/app/components/MenuProductsContext";
import { getProductsFresh } from "@/src/getProducts";

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
  const products = await getProductsFresh();

  return (
    <div className="min-h-dvh flex flex-col">
      <MenuProductsProvider initialData={products}>
        <PendingOrderAlert lg={lg} />
        <div className="flex-1">{children}</div>
      </MenuProductsProvider>
    </div>
  );
}
