import { jsonError } from "@/lib/http";
import { getReportPayload } from "@/lib/results";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/http";
import { requireStaff } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/crypto";

export async function GET(request: Request) {
  const { staff, error } = await requireStaff();
  if (!staff) return jsonError(error, 401);
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "json";
  const receipt = url.searchParams.get("receipt");

  if (receipt) {
    const ballot = await prisma.ballot.findUnique({
      where: { receiptHash: sha256(receipt.trim().toUpperCase()) },
      select: { id: true, createdAt: true },
    });
    return Response.json({
      counted: Boolean(ballot),
      at: ballot?.createdAt ?? null,
    });
  }

  const report = await getReportPayload();
  await writeAudit({
    actor: staff.role,
    action: "report_download",
    detail: format,
    ip: clientIp(request),
  });

  if (format === "csv") {
    const lines = ["section,key,value"];
    lines.push(`turnout,registered,${report.turnout.registered}`);
    lines.push(`turnout,voted,${report.turnout.voted}`);
    lines.push(`reconciliation,ok,${report.reconciliation.ok}`);
    for (const position of report.positions) {
      for (const candidate of position.candidates) {
        lines.push(
          `result,${JSON.stringify(`${position.title} / ${candidate.name}`)},${candidate.votes}`,
        );
      }
    }
    for (const row of report.timeline) {
      lines.push(`timeline,${row.hour},${row.count}`);
    }
    for (const row of report.devices) {
      lines.push(`device,${row.type},${row.count}`);
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="ucs-election-report.csv"',
      },
    });
  }

  return Response.json(report);
}
