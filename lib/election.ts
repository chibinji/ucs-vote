import { prisma } from "@/lib/prisma";

export async function getElection() {
  const existing = await prisma.election.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      positions: {
        orderBy: { sortOrder: "asc" },
        include: { candidates: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (existing) return existing;

  return prisma.election.create({
    data: {
      title: "UCS Election",
      status: "draft",
      positions: {
        create: [
          { title: "President", sortOrder: 1 },
          { title: "Vice President", sortOrder: 2 },
          { title: "Secretary", sortOrder: 3 },
        ],
      },
    },
    include: {
      positions: {
        orderBy: { sortOrder: "asc" },
        include: { candidates: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
}

export function shuffle<T>(items: T[], seed: string) {
  const copy = [...items];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
