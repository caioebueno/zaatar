import prisma from "@/prisma";
import { getOrderLinkSettings } from "@/src/getOrderLinkSettings";
import FeedbackForm from "./FeedbackForm";
import type { CSSProperties } from "react";

type FeedbackPageProps = {
  params: Promise<{
    lg: string;
    orderId: string;
  }>;
};

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { orderId, lg } = await params;
  const orderLinkSettings = await getOrderLinkSettings();
  let feedbackAlreadySent = false;

  try {
    const existingFeedbackRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "CustomerFeedback"
      WHERE "orderId" = ${orderId}
      LIMIT 1
    `;
    feedbackAlreadySent = existingFeedbackRows.length > 0;
  } catch {
    feedbackAlreadySent = false;
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    select: {
      id: true,
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });

  return (
    <div
      style={
        {
          "--brandBackground": orderLinkSettings.brandColor,
          "--color-brandBackground": orderLinkSettings.brandColor,
        } as CSSProperties
      }
    >
      <FeedbackForm
        orderId={orderId}
        lg={lg}
        orderFound={Boolean(order)}
        customerName={order?.customer?.name ?? null}
        customerPhone={order?.customer?.phone ?? null}
        initialSubmitted={feedbackAlreadySent}
      />
    </div>
  );
}
