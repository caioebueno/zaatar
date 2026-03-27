import { Client } from "whatsapp-web.js";
import prisma from "../prisma";
import sendPromotionalMessage, { delay } from "./sendPromotionalMessage";

const massPromotionalMessageTrigger = async (client: Client) => {
  const MESSAGE_ID = "lead-first";
  const CAMPAIGN_ID = "lead-whatsapp";

  try {
    console.log("MASS_PROMOTIONAL_MESSAGE_TRIGGER");
    const customers = await prisma.customer.findMany({
      where: {
        orders: {
          none: {},
        },
        promotionalMessages: {
          none: {
            message: {
              name: MESSAGE_ID,
            },
          },
        },
      },
      take: 100,
      orderBy: {
        orders: {
          _count: "desc",
        },
      },
    });
    console.log(customers.length);
    const pizzaMessage = await prisma.message.findUnique({
      where: {
        name: MESSAGE_ID,
      },
    });
    // const esfihaMessage = await prisma.message.findUnique({
    //   where: {
    //     name: "esfihas-sexta",
    //   },
    // });
    // const half = Math.ceil(customers.length / 2);
    // const firstHalf = customers.slice(0, half);
    // const secondHalf = customers.slice(half);
    if (!pizzaMessage) return console.log("MESSAGE_NOT_FOUND");
    // for (const customer of firstHalf) {
    //   await sendPromotionalMessage(client, esfihaMessage, customer);
    //   await delay(3000);
    // }
    for (const customer of customers) {
      try {
        await sendPromotionalMessage(
          client,
          pizzaMessage,
          customer,
          CAMPAIGN_ID,
        );
      } catch (err) {
        console.log("ERROR_SENDING_MESSAGE");
        console.log(err);
      }
      await delay(3000);
      console.log("SENT");
    }
    console.log("DONE");
  } catch (err) {
    console.log("ERROR_MASS_PROMOTIONAL_MESSAGE_TRIGGER");
    console.log(err);
  }
};

export default massPromotionalMessageTrigger;
