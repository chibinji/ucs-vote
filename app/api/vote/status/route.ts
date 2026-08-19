import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVoterSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getVoterSession();
  if (!session) return NextResponse.json({ signedIn: false, hasVoted: false });
  const voter = await prisma.voter.findUnique({
    where: { id: session.voterId },
    select: { hasVoted: true },
  });
  return NextResponse.json({
    signedIn: true,
    hasVoted: Boolean(voter?.hasVoted),
  });
}
