import { PrismaClient } from "@prisma/client";

// Next's dev server reloads modules on every edit; without the global cache each
// reload would open a new SQLite connection pool until the process runs out.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
