import { Client, MessageMedia } from "whatsapp-web.js";
import prisma, { Message, Customer } from "../prisma";
import { randomUUID } from "node:crypto";

const sendPromotionalMessage = async (
  client: Client,
  message: Message,
  customer: Customer,
  campaignId?: string,
) => {
  if (!customer.phone) return;
  const chatId = customer.phone + "@c.us";

  if (message.media) {
    console.log(__dirname + `/media/${message.media}`);
    const media = MessageMedia.fromFilePath(
      __dirname + `/media/${message.media}`,
    );
    await client.sendMessage(chatId, media, {
      caption: message.content.replace(/  /g, "\n\n"),
    });
  } else {
    await client.sendMessage(chatId, message.content.replace(/  /g, "\n\n"));
  }

  await prisma.customer.update({
    data: {
      lastMessageSent: new Date(),
    },
    where: {
      id: customer.id,
    },
  });
  await prisma.promotialMessage.create({
    data: {
      id: randomUUID(),
      customerId: customer.id,
      messageId: message.id,
      sentAt: new Date(),
      campaignId: campaignId,
    },
  });
};

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default sendPromotionalMessage;
