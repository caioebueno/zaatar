import { Montserrat } from "next/font/google";
import { NextPage } from "next";
import MenuPageContent from "./MenuPageContent";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Menu: NextPage<{
  params: Promise<{
    lg: string;
  }>;
}> = async ({ params }) => {
  const lg = (await params).lg;

  return (
    <div
      className={`flex flex-col items-center text-text ${montserrat.className} relative`}
    >
      <MenuPageContent lg={lg} />
    </div>
  );
};

export default Menu;
