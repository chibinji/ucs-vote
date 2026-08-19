import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { clientIp, jsonError } from "@/lib/http";
import { requireAdmin, requireStaff } from "@/lib/staff";

export async function GET() {
  const { staff, error } = await requireStaff();
  if (!staff) return jsonError(error, 401);
  const voters = await prisma.voter.findMany({
    where: { deviceTokenHash: { not: null } },
    select: {
      id: true,
      computerNumber: true,
      fullName: true,
      deviceLabel: true,
      hasVoted: true,
    },
    orderBy: { computerNumber: "asc" },
  });
  return NextResponse.json({ voters });
}

export async function POST(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);
  const body = (await request.json()) as { voterId?: string; reason?: string };
  if (!body.voterId || !body.reason?.trim()) {
    return jsonError("Voter and reason are required.");
  }

  const voter = await prisma.voter.update({
    where: { id: body.voterId },
    data: {
      deviceTokenHash: null,
      deviceFingerprint: null,
      deviceLabel: null,
    },
  });

  await writeAudit({
    actor: "admin",
    action: "device_reset",
    detail: `${voter.computerNumber}: ${body.reason.trim()}`,
    ip: clientIp(request),
  });

  return NextResponse.json({ ok: true });
}
