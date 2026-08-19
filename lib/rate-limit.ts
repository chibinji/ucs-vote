import { prisma } from "@/lib/prisma";

export async function hitRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const row = await prisma.rateLimit.findUnique({ where: { id: key } });

  if (!row || row.resetAt < now) {
    await prisma.rateLimit.upsert({
      where: { id: key },
      create: { id: key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
      update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
    });
    return { ok: true, remaining: limit - 1 };
  }

  if (row.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  await prisma.rateLimit.update({
    where: { id: key },
    data: { count: { increment: 1 } },
  });
  return { ok: true, remaining: limit - row.count - 1 };
}
