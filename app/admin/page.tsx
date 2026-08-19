import { ElectionHeader } from "@/components/ElectionHeader";
import { LiveDashboard } from "@/components/LiveDashboard";
import { getElection } from "@/lib/election";
import { getStaffSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminHomePage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");
  const election = await getElection();

  return (
    <div className="space-y-6">
      <ElectionHeader
        title={election.title}
        status={election.status}
        isAdmin={staff.role === "admin"}
      />
      <LiveDashboard />
    </div>
  );
}
