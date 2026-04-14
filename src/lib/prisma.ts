import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({
  connectionString,
  // Supabase uses a certificate chain not in Node's default trust store.
  // ssl.rejectUnauthorized=false keeps the connection encrypted (TLS is active)
  // but skips chain verification — standard practice for Supabase + pg.
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
