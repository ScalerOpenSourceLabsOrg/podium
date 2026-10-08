import { PrismaClient } from "@prisma/client";

// Next.js re-evaluates modules on every save in development, which would
// otherwise open a new connection pool per edit until Postgres refuses more.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
