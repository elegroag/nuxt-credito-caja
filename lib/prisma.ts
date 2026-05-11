import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

let url =
  process.env.DATABASE_ENV === "dev"
    ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL_PRO;

const adapter = new PrismaMariaDb(url!);

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };
export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
