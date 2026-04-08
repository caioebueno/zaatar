import { OrderSummaryModal } from "@/app/components/Price";
import OrderStatusStepper from "@/app/components/OrderStatusStepper";
import getOrder from "@/src/getOrder";
import { TOrderStatus, TOrderType } from "@/src/types/order";
import formatCurrency from "@/utils/formatCurrecy";
import { NextPage } from "next";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import text from "@/constants/text";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function getOrderHeadlineByStatus(
  status: TOrderStatus,
  type: TOrderType,
  content: { [key: string]: string },
): string {
  if (status === "ACCEPTED") return content["orderReceived"];
  if (status === "PREPARING") return content["preparing"];
  if (status === "DELIVERING") return content["outForDelivery"];
  if (type === "TAKEAWAY") return content["ready"];
  return content["delivered"];
}

const Confirmation: NextPage<{
  params: Promise<{
    orderId: string;
    lg: string;
  }>;
}> = async ({ params }) => {
  const resultParams = await params;
  const orderId = resultParams.orderId;
  const lg = resultParams.lg;

  const content = text[lg] || text["en"];
  const order = await getOrder(orderId);
  const orderHeadline = getOrderHeadlineByStatus(order.status, order.type, content);
  const paymentMethodLabel =
    order.paymentMethod === "CASH"
      ? content["cash"]
      : order.paymentMethod === "CARD"
        ? content["card"]
        : content["zelle"];

  return (
    <div className={`${montserrat.className} flex flex-col items-center`}>
      <div className="bg-foreground p-4 border-[#B9BFBF] border-b flex flex-row justify-between w-full">
        <Link
          href="/menu/en"
          className="p-0! text-[16px] font-semibold text-text! bg-transparent flex flex-row gap-2 items-center"
        >
          <FiArrowLeft size={18} />
          <span>{content["back"]}</span>
        </Link>
        <a
          href={`https://wa.me/15551234567?text=Hi%20I%20want%20to%20know%20more%20about%20order%20${order.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25d366] px-3 py-2 rounded-lg text-white flex flex-row items-center gap-1 font-semibold text-sm"
        >
          <FaWhatsapp size={18} />
          {content["chatOnWhatsapp"]}
        </a>
      </div>
      <div className="text-text flex flex-col items-center pt-8 gap-4">
        <div className="p-2 w-fit h-fit bg-brandBackground rounded-full">
          <FiCheck color="white" size={32} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[30px] text-lightText font-bold">
            #{order.number}
          </span>
          <span className="text-2xl font-bold">{orderHeadline}</span>
        </div>
      </div>
      <OrderStatusStepper
        content={content}
        status={order.status}
        type={order.type}
      />
      <OrderSummaryModal
        content={content}
        lg={lg}
        order={order}
        progressiveDiscountSnapshot={order.progressiveDiscountSnapshot}
        showSummaryCard
      />
      <div className="w-full max-w-[900px] px-4">
        <div className="flex flex-col  border-t border-t-[#E6E6E6] pt-6">
          <span className="text-base font-bold text-text">
            {content["paymentInfo"]}
          </span>
          <div className="flex items-center font-medium text-lightText">
            <span className="">{`${paymentMethodLabel} ${formatCurrency(order.totalAmount ?? 0)}`}</span>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[900px] px-4 pb-8 pt-8">
        <a
          href={`https://wa.me/15551234567?text=Hi%20I%20want%20to%20know%20more%20about%20order%20${order.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25d366] px-4 py-3 rounded-xl text-white flex flex-row items-center justify-center gap-2 font-bold text-lg w-full"
        >
          <FaWhatsapp size={20} />
          {content["inquireAboutYourOrder"]}
        </a>
      </div>
    </div>
  );
};

export default Confirmation;
