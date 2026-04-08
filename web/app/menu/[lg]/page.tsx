import { Montserrat } from "next/font/google";
import getProducts from "../../../src/getProducts";
import MenuPage from "@/app/components/MenuPage";
import { NextPage } from "next";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Menu: NextPage<{
  params: Promise<{
    lg: string;
  }>;
}> = async ({ params }) => {
  const categories = await getProducts();
  const lg = (await params).lg;

  return (
    <div
      className={`flex flex-col items-center text-text ${montserrat.className} relative`}
    >
      <MenuPage data={categories} lg={lg} />
    </div>
  );
};

export default Menu;
