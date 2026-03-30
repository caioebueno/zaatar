import { Button } from "@/components/ui/button";
import getOrder from "@/src/getOrder";
import { NextPage } from "next";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Confirmation: NextPage<{
  params: Promise<{
    orderId: string;
  }>;
}> = async ({ params }) => {
  const orderId = (await params).orderId;
  const order = await getOrder(orderId);

  return (
    <div>
      <div className="bg-foreground p-4 border-[#B9BFBF] border-b flex flex-row justify-between">
        <Link
          href="/menu/en"
          className="p-0! text-[16px] font-semibold text-text! bg-transparent flex flex-row gap-2 items-center"
        >
          <FiArrowLeft size={18} />
          <span>Back</span>
        </Link>
        <a
          href={`https://wa.me/15551234567?text=Hi%20I%20want%20to%20know%20more%20about%20order%20${order.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25d366] px-3 py-2 rounded-lg text-white flex flex-row items-center gap-1 font-semibold text-sm"
        >
          <FaWhatsapp size={18} />
          Chat on WhatsApp
        </a>
      </div>
      <div
        className={`text-text ${montserrat.className} flex flex-col items-center pt-8 gap-4`}
      >
        <div className="p-2 w-fit h-fit bg-brandBackground rounded-full">
          <FiCheck color="white" size={32} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[30px] text-lightText font-bold">
            #{order.number}
          </span>
          <span className="text-2xl font-bold">Order received!</span>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
