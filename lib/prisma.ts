import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as {
  _prisma?: PrismaClient;
  _prismaInit?: Promise<PrismaClient>;
};

async function createPrisma(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL || "file:./prisma/dev.db";

  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    const mod = await import("@prisma/adapter-libsql");
    const Adapter =
      (mod as any).PrismaLibSQL || (mod as any).PrismaLibSql || (mod as any).default;
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
    g._prismaInit = createPrisma().then((client) => {
      g._prisma = client;
      return client;
    });
  }
  return g._prismaInit;
}

function createLazyPrisma(): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_target, prop, receiver) {
      if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
      if (typeof prop === "symbol") return Reflect.get(_target, prop, receiver);

      if (g._prisma) {
        const value = (g._prisma as any)[prop];
        return typeof value === "function" ? value.bind(g._prisma) : value;
      }

      // Model namespaces: prisma.voter.findMany(...)
      // Client methods: prisma.$transaction(...)
      return new Proxy(function () {} as any, {
        get(_t2, method) {
          return (...args: unknown[]) =>
            getPrisma().then((client: any) => {
              const target = client[prop];
              const value = target?.[method as string];
              if (typeof value === "function") return value.apply(target, args);
              return value;
            });
        },
        apply(_t2, _thisArg, args) {
          return getPrisma().then((client: any) => {
            const value = client[prop];
            if (typeof value === "function") return value.apply(client, args);
            throw new Error(`Prisma property "${String(prop)}" is not a function`);
          });
        },
      });
    },
  });
}

export const prisma = createLazyPrisma();
