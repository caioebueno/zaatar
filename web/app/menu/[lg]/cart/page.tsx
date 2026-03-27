import { NextPage } from "next";
import { Montserrat } from "next/font/google";
import getProducts from "../../../../../src/getProducts";
import { CartList } from "@/app/components/Price";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Cart: NextPage = async () => {
  const data = await getProducts()

  return (
    <div className={`${montserrat.className}`}>
        <CartList data={data} />
      </div>
  )
}

export default Cart
