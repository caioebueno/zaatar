// import { Client, LocalAuth } from "whatsapp-web.js";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
// import { MongoStore } from "wwebjs-mongo";
// import mongoose from "mongoose";

// const wwebVersion = "2.2412.54";

const initiateWhatsapp = (): Promise<Client> =>
  new Promise((resolve, reject) => {
    console.log("START INITIATION");
    try {
      // if (process.env.MONGODB_URI !== undefined) {
      // mongoose.connect(process.env.MONGODB_URI).then(() => {
      //   const store = new MongoStore({ mongoose: mongoose });
      const client = new Client({
        // puppeteer: {
        //   headless: false,
        // },
        // authStrategy: new RemoteAuth({
        //   store: store,
        //   backupSyncIntervalMs: 300000,
        // }),
        authStrategy: new LocalAuth(),
        // webVersionCache: {
        //   type: "remote",
        //   remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
        // },
      })
        .on("ready", () => {
          console.log("CLIENT READY");
          resolve(client);
        })
        .on("qr", (qr) => {
          qrcode.generate(qr, { small: true });
        })
        .on("remote_session_saved", () => {
          console.log("SESSION SAVED");
        });

      client.initialize();
      console.log("AFTER CLIENT initialize");
      //   });
      // }
    } catch (err) {
      reject(err);
    }
  });

export default initiateWhatsapp;
