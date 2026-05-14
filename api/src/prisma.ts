import { PrismaClient } from "../../web/src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { ensureEnvLoaded } from "./shared/env/loadEnv.js";

ensureEnvLoaded();

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
