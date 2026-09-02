import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

// In dev, Next.js reloads modules on every file save. Without this, that
// would create a brand new PrismaClient (and a new DB connection) on every
// save. Stashing it on `globalThis` keeps one instance alive across reloads.
const globalForPrisma = globalThis;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
