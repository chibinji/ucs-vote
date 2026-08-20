import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { receiptCode, sha256 } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { getElection } from "@/lib/election";
import { clientIp, deviceTypeFromLabel, jsonError } from "@/lib/http";
import { getVoterSession, setVoteDoneCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getVoterSession();
    if (!session) return jsonError("Sign in to vote.", 401);

    const election = await getElection();
    if (election.status !== "open") return jsonError("Voting is not open.");

    const body = (await request.json()) as {
      choices?: Record<string, string>;
      deviceLabel?: string;
    };
    const choices = body.choices || {};

    for (const position of election.positions) {
      const candidateId = choices[position.id];
      if (!candidateId) return jsonError(`Select a candidate for ${position.title}.`);
      if (!position.candidates.some((c) => c.id === candidateId)) {
        return jsonError("Invalid candidate selection.");
      }
    }

    const receipt = receiptCode();

    // Avoid interactive $transaction — unreliable with Turso/libSQL on Vercel.
    const locked = await prisma.voter.updateMany({
      where: { id: session.voterId, hasVoted: false },
      data: { hasVoted: true, votedAt: new Date() },
    });
    if (locked.count !== 1) {
      return jsonError("You have already voted.", 409);
    }

    try {
      await prisma.ballot.create({
        data: {
          receiptHash: sha256(receipt),
          deviceType: deviceTypeFromLabel(body.deviceLabel),
          choices: {
            create: election.positions.map((position) => ({
              positionId: position.id,
              candidateId: choices[position.id],
            })),
          },
        },
      });
    } catch (error) {
      // Roll back the voted flag if ballot write fails
      await prisma.voter.updateMany({
        where: { id: session.voterId, hasVoted: true },
        data: { hasVoted: false, votedAt: null },
      });
      console.error("ballot create failed", error);
      return jsonError("Could not record your ballot. Please try again.", 500);
    }

    await setVoteDoneCookie();
    await writeAudit({
      actor: "voter",
      action: "ballot_cast",
      ip: clientIp(request),
    });

    return NextResponse.json({ ok: true, receipt });
  } catch (error) {
    console.error("vote cast failed", error);
    return jsonError(
      error instanceof Error ? error.message : "Could not cast vote.",
      500,
    );
  }
}
