import { NextPage } from "next";
import { Montserrat } from "next/font/google";
import CartPageContent from "./CartPageContent";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Cart: NextPage<{
  params: Promise<{
    lg: string;
  }>;
}> = async ({ params }) => {
  const lg = (await params).lg;

  return (
    <div className={`${montserrat.className} h-full`}>
      <CartPageContent lg={lg} />
    </div>
  );
};

export default Cart;
