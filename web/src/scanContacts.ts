// // import OpenAI from "openai";
// // import { Client, PrivateChat } from "whatsapp-web.js";
// import { Client, PrivateChat } from "whatsapp-web.js";
// import prisma from "../prisma";
// import { randomUUID } from "node:crypto";

// const scanContacts = async (client: Client) => {
//   console.log("SCAN CONTACTS");
//   const contacts: {
//     name: string;
//     phone: string;
//   }[] = [];
//   const allCostumers = await prisma.customer.findMany();
//   const chats = await client.getChats();
//   console.log("CHAT LENGTH: ", chats.length);
//   const privateChats = chats.filter((item) => item.isGroup === false);
//   // const openAi = new OpenAI({
//   //   apiKey: process.env.OPEN_AI_API_KEY,
//   // });
//   const privateChunks = chunkArray(privateChats, 50);
//   // console.log(chatChunks[0]);
//   let chunkI = 0;
//   for (const chatChunk of privateChunks) {
//     console.log("CHUNK: ", chunkI);
//     for (const chat of chatChunk) {
//       try {
//         const contact = await chat.getContact();
//         // const messages = await chat.fetchMessages({
//         //   limit: 100,
//         // });
//         const findExistingCustomer = allCostumers.find(
//           (customer) => customer.phone === contact.number,
//         );
//         if (!findExistingCustomer) {
//           const data = {
//             phone: contact.number,
//             name: contact.pushname,
//           };
//           contacts.push(data);
//         }
//       } catch (err) {
//         console.log(err);
//       }
//       // const parsedMessages = messages.map((item) => ({
//       //   message: item.body,
//       //   from: item.from === "12393552467@c.us" ? "ME" : "CLIENT",
//       //   date: new Date(item.timestamp * 1000).toISOString(),
//       // }));
//       // // console.log("RUNNING CONTACT", JSON.stringify(parsedMessages).length);
//       // // console.log(parsedMessages);
//       // console.log(parsedMessages);
//       // const run = await openAi.beta.threads.createAndRun({
//       //   assistant_id: "asst_YUZAa6ELycrej3F4iyshyGvN",
//       //   thread: {
//       //     messages: [
//       //       {
//       //         content: JSON.stringify(parsedMessages),
//       //         role: "user",
//       //       },
//       //     ],
//       //   },
//       // });
//       // let runStatus = run.status;
//       // while (runStatus !== "completed") {
//       //   await new Promise((r) => setTimeout(r, 1000));
//       //   if (run.id) {
//       //     runStatus = (
//       //       await openAi.beta.threads.runs.retrieve(run.id, {
//       //         thread_id: run.thread_id,
//       //       })
//       //     ).status;
//       //   }
//       // }
//       // const aiMessages = await openAi.beta.threads.messages.list(run.thread_id);
//       // const last = aiMessages.data.find((msg) => msg.role === "assistant");
//       // const firstContent = last?.content[0];
//       // if (firstContent && firstContent.type === "text") {
//       //   try {
//       //     const jsonResponse = JSON.parse(firstContent.text.value);
//       //     console.log(jsonResponse);
//       //   } catch (err) {
//       //     console.log("ERROR PARSING JSON RESPONSE");
//       //   }
//       // }
//     }
//     chunkI = chunkI + 1;
//     // console.log(await chat[0].getContact());

//     // console.log("chunk run");
//     // const data = chat.map((item) => ({
//     //   ...item,
//     //   lastMessage: undefined,
//     // }));
//     // console.log(JSON.stringify(data).length);
//     // // console.log(chatChunk);

//     // let runStatus = run.status;
//     // while (runStatus !== "completed") {
//     //   console.log("wating complete");
//     //   console.log(runStatus);
//     //   await new Promise((r) => setTimeout(r, 1000));
//     //   if (run.id) {
//     //     runStatus = (
//     //       await openAi.beta.threads.runs.retrieve(run.id, {
//     //         thread_id: run.thread_id,
//     //       })
//     //     ).status;
//     //   }
//     // }
//     // const messages = await openAi.beta.threads.messages.list(run.thread_id);
//     // const last = messages.data.find((msg) => msg.role === "assistant");
//     // const firstContent = last?.content[0];
//     // if (firstContent && firstContent.type === "text") {
//     //   try {
//     //     const jsonResponse = JSON.parse(firstContent.text.value);
//     //     console.log(jsonResponse);
//     //   } catch (err) {
//     //     console.log("ERROR PARSING JSON RESPONSE");
//     //   }
//     // }
//   }
//   console.log("CREATING: ", contacts.length);
//   await prisma.customer.createMany({
//     data: contacts.map((chat) => ({
//       id: randomUUID(),
//       phone: chat.phone,
//       name: chat.name,
//     })),
//   });
//   console.log("DONE");

//   // console.log("thread", thread);
// };

// function chunkArray<T>(arr: T[], size: number): T[][] {
//   if (size <= 0) throw new Error("Size must be greater than 0");

//   const result: T[][] = [];
//   for (let i = 0; i < arr.length; i += size) {
//     result.push(arr.slice(i, i + size));
//   }
//   return result;
// }

// export default scanContacts;
