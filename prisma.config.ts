import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config();

const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
const isTurso = url.startsWith("libsql://") || url.startsWith("https://");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: isTurso ? "file:./prisma/dev.db" : url,
  },
  ...(isTurso
    ? {
        experimental: { adapter: true },
        async adapter() {
          const libsqlAdapter = await import("@prisma/adapter-libsql");
          const AdapterClass = (libsqlAdapter as any).PrismaLibSQL || (libsqlAdapter as any).PrismaLibSql || (libsqlAdapter as any).default;
          return new AdapterClass({
            url,
            authToken: process.env.TURSO_AUTH_TOKEN,
          });
        },
      }
    : {}),
});
