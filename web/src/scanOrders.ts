// import prisma from "../prisma";
// import fs from "node:fs/promises";
// import Papa from "papaparse";
// import { randomUUID } from "node:crypto";
// import { isSameDay } from "date-fns";

// const scanOrders = async () => {
//   console.log("SCAN ORDERS");
//   const file = await fs.readFile(
//     "assets/olaClickSales/orders-23-02-2026/orders.csv",
//     "utf8",
//   );
//   const { data } = Papa.parse<{
//     Total: string;
//     Phone: string;
//     "Order public id": string;
//     "Creation date": string;
//   }>(file, {
//     header: true,
//     skipEmptyLines: true,
//   });
//   const allOrders = await prisma.order.findMany();
//   const allCustomers = await prisma.customer.findMany();
//   for (const order of data) {
//     const findCustomer: any = allCustomers.find(
//       (customer) => customer.phone === order.Phone.replace(" ", ""),
//     );
//     if (findCustomer) {
//       const date = order["Creation date"].split("|")[0]?.trim();

//       const findOrder = allOrders.find((existingOrder) => {
//         // console.log(existingOrder.createdAt, parseDate(date));
//         return (
//           existingOrder.customerId === findCustomer.id &&
//           isSameDay(existingOrder.createdAt, parseDate(date))
//         );
//       });
//       const externalId = order["Order public id"];
//       if (findOrder) {
//         console.log("existing order", parseDate(date));
//         await prisma.order.update({
//           where: {
//             id: findOrder.id,
//           },
//           data: {
//             externalId: externalId,
//           },
//         });
//       } else {
//         console.log("new order", parseDate(date), findCustomer.id);
//         await prisma.order.create({
//           data: {
//             amount: Number(order.Total),
//             id: randomUUID(),
//             customerId: findCustomer.id,
//             createdAt: parseDate(date),
//             externalId: externalId,
//           },
//         });
//       }
//     }
//   }
//   console.log(data.length);
// };

// const parseDate = (input: string) => {
//   const [day, month, year] = input.split("/").map(Number);

//   // Create a Date object (month is 0-based in JS)
//   const date = new Date(year, month - 1, day);
//   return date;
// };

// export default scanOrders;
