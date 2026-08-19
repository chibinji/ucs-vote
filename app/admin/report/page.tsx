import { ReportPanel } from "@/components/ReportPanel";
import { getStaffSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ReportPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");
  return (
    <div>
      <h1 className="display mb-2 text-3xl text-[#2C8992]">Insights report</h1>
      <p className="mb-6 text-sm">
        Charts for turnout and results. Export a voter copy to share, or a staff copy for officers.
      </p>
      <ReportPanel />
    </div>
  );
}
