import "dotenv/config";
// import initiateWhatsapp from "./initiateWhatsapp";
// import massPromotionalMessageTrigger from "./massPromotionalMessageTrigger";
import initiateWhatsapp from "./initiateWhatsapp";
// import sendPromotionalMessage from "./sendPromotionalMessage";
// import scanContacts from "./scanContacts";
// import scanOrders from "./scanOrders";
// import { addAddressToCustomersByOrders } from "./addAddressToCustomers";
// import sendPromotionalMessage from "./sendPromotionalMessage";
// import initiateWhatsapp from "./initiateWhatsapp";
// import prisma from "../prisma";
// import { dedupeCustomersByPhone } from "./dedupeCustomersByPhone";
import massPromotionalMessageTrigger from "./massPromotionalMessageTrigger";
// import massPromotionalMessageTrigger from "./massPromotionalMessageTrigger";
// import prisma from "../prisma";
// import sendPromotionalMessage from "./sendPromotionalMessage";

const main = async () => {
  // const dupPhones = await prisma.customer.groupBy({
  //   by: ["phone"],
  //   where: {
  //     phone: { not: null },
  //     // optional: also exclude empty strings
  //     NOT: { phone: "" },
  //   },
  //   _count: { _all: true },
  //   having: {
  //     phone: { _count: { gt: 1 } },
  //   },
  // });

  // const phones = dupPhones
  //   .map((p) => p.phone)
  //   .filter((p): p is string => typeof p === "string" && p.length > 0);

  // // 2) Fetch all customers whose phone is in that duplicated list
  // const customers = await prisma.customer.findMany({
  //   where: { phone: { in: phones } },
  //   orderBy: [{ phone: "asc" }, { createdAt: "asc" }],
  //   include: {
  //     orders: true, // optional
  //   },
  // });

  // await dedupeCustomersByPhone({
  //   dryRun: false,
  //   batchPhones: 3500,
  // });
  // massPromotionalMessageTrigger();
  const client = await initiateWhatsapp();
  // await scanOrders();
  // await addAddressToCustomersByOrders();
  // const message = await prisma.message.findUnique({
  //   where: {
  //     name: "lead-first",
  //   },
  // });
  // console.log(message);
  // const customer = await prisma.customer.findFirst({
  //   where: {
  //     phone: "19297669288",
  //   },
  // });
  await massPromotionalMessageTrigger(client);
  // console.log("CLIENTE READY");
  // await scanContacts(client);
  // const chatId = "19176452888@c.us";
  // client.sendMessage(
  //   chatId,
  //   `🍕🔥 Nova localização! Para melhor atender, o Zaatar Grill & Pizza agora está na 17800 Bali Blvd, Winter Garden, FL 34787. Esperamos sua visita!`,
  // );
  // if (!message || !customer) return;
  // await sendPromotionalMessage(client, message, customer);
  // console.log("READY");
};

main();
