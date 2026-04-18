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

export const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false },
  // Fail fast if DB is unreachable (e.g. Supabase paused) so callers' try/catch
  // can handle the error promptly instead of hanging until Vercel timeout.
  connectionTimeoutMillis: 4000,
  idleTimeoutMillis: 10000,
  max: 3,
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
