import "dotenv/config";
import { config as dotenvLocal } from "dotenv";
import path from "path";
dotenvLocal({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
