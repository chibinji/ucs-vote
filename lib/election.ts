import { prisma } from "@/lib/prisma";

const electionSelect = {
  id: true,
  title: true,
  status: true,
  openedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  positions: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      electionId: true,
      title: true,
      sortOrder: true,
      candidates: {
        orderBy: { sortOrder: "asc" as const },
        select: {
          id: true,
          positionId: true,
          name: true,
          sortOrder: true,
          photoMime: true,
        },
      },
    },
  },
};

export type LeanCandidate = {
  id: string;
  positionId: string;
  name: string;
  sortOrder: number;
  photoMime: string | null;
  hasPhoto: boolean;
};

export type LeanPosition = {
  id: string;
  electionId: string;
  title: string;
  sortOrder: number;
  candidates: LeanCandidate[];
};

export type LeanElection = {
  id: string;
  title: string;
  status: string;
  openedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  positions: LeanPosition[];
};

function withHasPhoto(
  election: {
    id: string;
    title: string;
    status: string;
    openedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    positions: {
      id: string;
      electionId: string;
      title: string;
      sortOrder: number;
      candidates: {
        id: string;
        positionId: string;
        name: string;
        sortOrder: number;
        photoMime: string | null;
      }[];
    }[];
  },
): LeanElection {
  return {
    ...election,
    positions: election.positions.map((position) => ({
      ...position,
      candidates: position.candidates.map((candidate) => ({
        ...candidate,
        hasPhoto: Boolean(candidate.photoMime),
      })),
    })),
  };
}

/** Lean election load — never fetches candidate photo BLOBs. */
export async function getElection(): Promise<LeanElection> {
  const existing = await prisma.election.findFirst({
    orderBy: { createdAt: "asc" },
    select: electionSelect,
  });
  if (existing) return withHasPhoto(existing);

  const created = await prisma.election.create({
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
    select: electionSelect,
  });
  return withHasPhoto(created);
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
