import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { getElection } from "@/lib/election";
import { clientIp, jsonError } from "@/lib/http";
import { requireAdmin, requireStaff } from "@/lib/staff";

export async function GET() {
  const { staff, error } = await requireStaff();
  if (!staff) return jsonError(error, 401);
  const election = await getElection();
  return NextResponse.json(election);
}

export async function POST(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);

  const body = (await request.json()) as { action?: string; title?: string };
  const election = await getElection();
  const ip = clientIp(request);

  if (body.action === "rename") {
    const title = body.title?.trim();
    if (!title) return jsonError("Election title is required.");
    await prisma.election.update({ where: { id: election.id }, data: { title } });
    await writeAudit({ actor: "admin", action: "election_rename", detail: title, ip });
    return NextResponse.json({ ok: true, title });
  }

  if (body.action === "open") {
    const voterCount = await prisma.voter.count();
    if (voterCount === 0) return jsonError("Upload registered voters before opening.");
    if (election.positions.length === 0) return jsonError("Add at least one position first.");
    if (election.positions.some((position) => position.candidates.length === 0)) {
      return jsonError("Add at least one candidate to every position first.");
    }
    await prisma.election.update({
      where: { id: election.id },
      data: { status: "open", openedAt: new Date(), closedAt: null },
    });
    await writeAudit({ actor: "admin", action: "election_open", ip });
  } else if (body.action === "close") {
    await prisma.election.update({
      where: { id: election.id },
      data: { status: "closed", closedAt: new Date() },
    });
    await writeAudit({ actor: "admin", action: "election_close", ip });
  } else if (body.action === "restart") {
    await prisma.$transaction([
      prisma.ballotChoice.deleteMany(),
      prisma.ballot.deleteMany(),
      prisma.otpCode.deleteMany(),
      prisma.blockedAttempt.deleteMany(),
      prisma.voter.updateMany({
        data: {
          hasVoted: false,
          votedAt: null,
          deviceTokenHash: null,
          deviceFingerprint: null,
          deviceLabel: null,
        },
      }),
      prisma.election.update({
        where: { id: election.id },
        data: { status: "draft", openedAt: null, closedAt: null },
      }),
    ]);
    await writeAudit({
      actor: "admin",
      action: "election_restart",
      detail: "Cleared ballots, devices, OTPs and returned to draft",
      ip,
    });
  } else {
    return jsonError("Unknown action.");
  }

  return NextResponse.json({ ok: true });
}
