import { Montserrat } from "next/font/google";
import type { Metadata, NextPage } from "next";
import MenuPageContent from "./MenuPageContent";
import { getOrderLinkSettings } from "@/src/getOrderLinkSettings";
import { buildMenuMetadata } from "@/app/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lg: string }>;
}): Promise<Metadata> {
  const { lg } = await params;
  const settings = await getOrderLinkSettings();

  return buildMenuMetadata({
    lg,
    businessName: settings.businessName,
    imageUrl: settings.bannerPhotoUrl || settings.logoUrl || "/logo.png",
  });
}

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
