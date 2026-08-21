import { redirect } from "next/navigation";
import { BrandFooter, BrandHeader } from "@/components/BrandChrome";
import { BallotForm } from "@/components/BallotForm";
import { getElection, shuffle } from "@/lib/election";
import { getVoterSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VotePage() {
  const session = await getVoterSession();
  if (!session) redirect("/");
  const voter = await prisma.voter.findUnique({ where: { id: session.voterId } });
  if (!voter) redirect("/");
  if (voter.hasVoted) redirect("/vote/receipt");

  const election = await getElection();
  if (election.status !== "open") redirect("/");

  const positions = election.positions.map((position) => ({
    id: position.id,
    title: position.title,
    candidates: shuffle(
      position.candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        hasPhoto: candidate.hasPhoto,
      })),
      session.voterId + position.id,
    ),
  }));

  return (
    <>
      <BrandHeader subtitle="Cast your secret ballot" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="mb-6 text-sm">
          Signed in as {voter.computerNumber}. Choose one candidate per position. Your name is not
          stored with your choices.
        </p>
        <BallotForm positions={positions} />
      </main>
      <BrandFooter />
    </>
  );
}
