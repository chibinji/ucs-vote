import { prisma } from "@/lib/prisma";
import { getElection } from "@/lib/election";

export async function getLiveSnapshot() {
  const election = await getElection();
  const [registered, voted, ballots, blocked, choices] = await Promise.all([
    prisma.voter.count(),
    prisma.voter.count({ where: { hasVoted: true } }),
    prisma.ballot.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { createdAt: true, deviceType: true },
    }),
    prisma.blockedAttempt.groupBy({
      by: ["kind"],
      _count: { kind: true },
    }),
    prisma.ballotChoice.groupBy({
      by: ["candidateId", "positionId"],
      _count: { candidateId: true },
    }),
  ]);

  const countByCandidate = new Map(
    choices.map((row) => [row.candidateId, row._count.candidateId]),
  );

  return {
    election: {
      id: election.id,
      title: election.title,
      status: election.status,
      openedAt: election.openedAt,
      closedAt: election.closedAt,
    },
    turnout: {
      registered,
      voted,
      percent: registered === 0 ? 0 : Math.round((voted / registered) * 1000) / 10,
    },
    reconciliation: {
      ballots: await prisma.ballot.count(),
      votersMarked: voted,
      ok: (await prisma.ballot.count()) === voted,
    },
    blocked: Object.fromEntries(blocked.map((row) => [row.kind, row._count.kind])),
    recent: ballots.map((row) => ({
      at: row.createdAt.toISOString(),
      deviceType: row.deviceType,
    })),
    positions: election.positions.map((position) => {
      const total = position.candidates.reduce(
        (sum, candidate) => sum + (countByCandidate.get(candidate.id) || 0),
        0,
      );
      return {
        id: position.id,
        title: position.title,
        total,
        candidates: position.candidates.map((candidate) => {
          const votes = countByCandidate.get(candidate.id) || 0;
          return {
            id: candidate.id,
            name: candidate.name,
            votes,
            percent: total === 0 ? 0 : Math.round((votes / total) * 1000) / 10,
            hasPhoto: Boolean(candidate.photoData),
          };
        }),
      };
    }),
  };
}

export async function getReportPayload() {
  const live = await getLiveSnapshot();
  const [hourly, devices, audit] = await Promise.all([
    prisma.ballot.findMany({ select: { createdAt: true, deviceType: true } }),
    prisma.ballot.groupBy({
      by: ["deviceType"],
      _count: { deviceType: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { at: "desc" },
      take: 100,
    }),
  ]);

  const byHour = new Map<string, number>();
  for (const ballot of hourly) {
    const key = ballot.createdAt.toISOString().slice(0, 13) + ":00";
    byHour.set(key, (byHour.get(key) || 0) + 1);
  }

  return {
    ...live,
    generatedAt: new Date().toISOString(),
    timeline: [...byHour.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count })),
    devices: devices.map((row) => ({
      type: row.deviceType || "unknown",
      count: row._count.deviceType,
    })),
    audit: audit.map((row) => ({
      at: row.at.toISOString(),
      actor: row.actor,
      action: row.action,
      detail: row.detail,
      ip: row.ip,
    })),
  };
}
