import { actorLabel, actionLabel, formatWhen, noteLabel } from "@/lib/audit-copy";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AuditPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");
  const logs = await prisma.auditLog.findMany({
    orderBy: { at: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="display mb-2 text-3xl text-[#2C8992]">Activity log</h1>
      <p className="mb-6 text-sm">A simple record of what happened in the election. Technical details are hidden.</p>
      <div className="card overflow-x-auto p-5">
        {logs.length === 0 ? (
          <p className="py-8 text-center text-sm">Nothing has been recorded yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="table-head">
                <th className="py-2 pr-4">When</th>
                <th className="pr-4">Who</th>
                <th className="pr-4">What happened</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const note = noteLabel(log.detail);
                return (
                  <tr key={log.id} className="border-t border-[#454B4C]/10">
                    <td className="py-3 pr-4 whitespace-nowrap">{formatWhen(log.at)}</td>
                    <td className="pr-4">{actorLabel(log.actor)}</td>
                    <td className="pr-4">{actionLabel(log.action)}</td>
                    <td>{note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
