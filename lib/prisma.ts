import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as {
  _prisma?: PrismaClient;
  _prismaInit?: Promise<PrismaClient>;
};

async function createPrisma(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL || "file:./prisma/dev.db";

  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    const mod = await import("@prisma/adapter-libsql");
    const Adapter = (mod as any).PrismaLibSQL || (mod as any).PrismaLibSql || (mod as any).default;
    const adapter = new Adapter({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }

  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

export function getPrisma(): Promise<PrismaClient> {
  if (g._prisma) return Promise.resolve(g._prisma);
  if (!g._prismaInit) {
    g._prismaInit = createPrisma().then((c) => {
      if (process.env.NODE_ENV !== "production") g._prisma = c;
      return c;
    });
  }
  return g._prismaInit;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
    if (g._prisma) return (g._prisma as any)[prop];
    return new Proxy(
      {},
      {
        get(_t2, method: string) {
          return (...args: unknown[]) =>
            getPrisma().then((client: any) => client[prop][method](...args));
        },
      },
    );
  },
});
