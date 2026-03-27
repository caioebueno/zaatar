import { PrismaClient, Message, Customer } from "../src/generated/prisma";
const prisma = new PrismaClient();
export default prisma;
export type { Message, Customer };
