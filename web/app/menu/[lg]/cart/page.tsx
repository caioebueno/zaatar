import { NextPage } from "next";
import { Montserrat } from "next/font/google";
import getProducts from "../../../../src/getProducts";
import { CartList } from "@/app/components/Price";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Cart: NextPage<{
  params: Promise<{
    lg: string;
  }>;
}> = async ({ params }) => {
  const data = await getProducts();
  const lg = (await params).lg;

  return (
    <div className={`${montserrat.className} h-full`}>
      <CartList data={data} lg={lg} />
    </div>
  );
};

export default Cart;
