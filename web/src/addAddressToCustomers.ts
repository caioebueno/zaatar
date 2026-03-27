// import fs from "node:fs/promises";
// import Papa from "papaparse";
// import prisma from "../prisma";

// const addAddressToCustomers = async () => {
//   const file = await fs.readFile("assets/olaClickCustomers.csv", "utf8");
//   const { data } = Papa.parse(file, {
//     header: true,
//     skipEmptyLines: true,
//   });
//   const allCustomers = await prisma.customer.findMany();
//   for (const customer of allCustomers) {
//     const findAddress: any = data.find(
//       (item: any) => item.Phone.replace(" ", "") === customer.phone,
//     );
//     if (findAddress) {
//       await prisma.customer.update({
//         where: {
//           id: customer.id,
//         },
//         data: {
//           address: findAddress.Address,
//         },
//       });
//     }
//     console.log(findAddress ? "FOUND" : "NOT FOUND");
//   }
// };

// const addAddressToCustomersByOrders = async () => {
//   const file = await fs.readFile(
//     "assets/olaClickSales/orders-11-02-2026/orders.csv",
//     "utf8",
//   );
//   const { data } = Papa.parse(file, {
//     header: true,
//     skipEmptyLines: true,
//   });
//   console.log(data);
//   // const allCustomers = await prisma.customer.findMany();
//   // for (const customer of allCustomers) {
//   //   const findAddress: any = data.find(
//   //     (item: any) => item.Phone.replace(" ", "") === customer.phone,
//   //   );
//   //   if (findAddress) {
//   //     await prisma.customer.update({
//   //       where: {
//   //         id: customer.id,
//   //       },
//   //       data: {
//   //         address: findAddress.Address,
//   //       },
//   //     });
//   //   }
//   //   console.log(findAddress ? "FOUND" : "NOT FOUND");
// };

// export { addAddressToCustomersByOrders, addAddressToCustomers };
