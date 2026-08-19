import { VotersPanel } from "@/components/VotersPanel";
import { getStaffSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function VotersPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");
  return (
    <div>
      <h1 className="display mb-2 text-3xl text-[#2C8992]">Registered voters</h1>
      <p className="mb-6 text-sm">Only people on this list can vote. You can upload a CSV or add, edit, and remove names.</p>
      <VotersPanel isAdmin={staff.role === "admin"} />
    </div>
  );
}
