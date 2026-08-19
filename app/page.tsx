import { BrandFooter, BrandHeader } from "@/components/BrandChrome";
import { LoginForm } from "@/components/LoginForm";
import { VoteLock } from "@/components/VoteLock";
import { getElection } from "@/lib/election";
import { getVoterSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const election = await getElection();
  const session = await getVoterSession();
  if (session) {
    const voter = await prisma.voter.findUnique({ where: { id: session.voterId } });
    if (voter?.hasVoted) redirect("/vote/receipt");
  }

  const status =
    election.status === "open"
      ? "Voting is open. Sign in with your computer number and CS email."
      : election.status === "closed"
        ? "Voting has ended."
        : "Voting is not open yet. Please wait for the election officers.";

  return (
    <>
      <VoteLock mode="ballot" />
      <BrandHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8">
        <p className="mb-6 text-center text-sm">{status}</p>
        {election.status === "open" ? <LoginForm /> : null}
        <p className="mt-6 text-center text-xs">
          Officers: <a className="text-[#2C8992] underline" href="/admin/login">Admin sign in</a>
        </p>
      </main>
      <BrandFooter />
    </>
  );
}
