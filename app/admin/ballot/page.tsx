import { BallotEditor } from "@/components/BallotEditor";
import { getElection } from "@/lib/election";
import { getStaffSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function BallotPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");
  const election = await getElection();

  return (
    <div>
      <h1 className="display mb-2 text-3xl text-[#2C8992]">Ballot setup</h1>
      <p className="mb-6 text-sm">Create races, add candidates, and upload photos. Changes save as soon as you add, rename, or delete.</p>
      <BallotEditor
        isAdmin={staff.role === "admin"}
        locked={election.status !== "draft"}
        positions={election.positions.map((position) => ({
          id: position.id,
          title: position.title,
          candidates: position.candidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            hasPhoto: Boolean(candidate.photoData),
          })),
        }))}
      />
    </div>
  );
}
