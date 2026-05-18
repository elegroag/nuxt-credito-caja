import dotenv from "dotenv";
import { PrismaClient, Prisma, $Enums  } from "../prisma/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

dotenv.config();

const url
  = process.env.DATABASE_ENV === "dev"
    ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL_PRO;

const adapter = new PrismaMariaDb(url!);

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter
  });
};

const globalForPrisma = globalThis as {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof globalThis;

const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton();

export { prisma, Prisma, $Enums };
export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaGlobal = prisma;