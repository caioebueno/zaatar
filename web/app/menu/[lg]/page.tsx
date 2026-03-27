import { Montserrat } from "next/font/google";
import getProducts from '../../../../src/getProducts'
import MenuPage from "@/app/components/MenuPage";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Menu = async () => {
  const categories = await getProducts()

  return (
    <div className={`h-dvh flex flex-col items-center text-text ${montserrat.className} relative`}>
      <MenuPage data={categories} />
    </div>
  )
}


export default Menu
