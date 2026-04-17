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

// Strip ?sslmode=... from the URL so pg uses our explicit ssl config below.
// Since pg v8.12, sslmode=require is treated as verify-full (breaking Supabase).
// We remove it from the URL and pass ssl.rejectUnauthorized=false directly.
let cleanConnectionString = connectionString;
try {
  const u = new URL(connectionString);
  u.searchParams.delete("sslmode");
  cleanConnectionString = u.toString();
} catch {
  // not a valid URL — use as-is
}

const pool = new Pool({
  connectionString: cleanConnectionString,
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
