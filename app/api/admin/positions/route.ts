import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { getElection } from "@/lib/election";
import { clientIp, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/staff";

export async function POST(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);
  const election = await getElection();
  if (election.status !== "draft") {
    return jsonError("Ballot is locked while voting is open or closed. Restart to edit.");
  }

  const body = (await request.json()) as { title?: string };
  const title = body.title?.trim();
  if (!title) return jsonError("Position title is required.");

  const position = await prisma.position.create({
    data: {
      electionId: election.id,
      title,
      sortOrder: election.positions.length + 1,
    },
  });
  await writeAudit({
    actor: "admin",
    action: "position_create",
    detail: title,
    ip: clientIp(request),
  });
  return NextResponse.json(position);
}

export async function PATCH(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);
  const election = await getElection();
  if (election.status !== "draft") return jsonError("Ballot is locked.");
  const body = (await request.json()) as { id?: string; title?: string };
  const title = body.title?.trim();
  if (!body.id || !title) return jsonError("Position id and title are required.");
  const position = await prisma.position.update({
    where: { id: body.id },
    data: { title },
  });
  await writeAudit({
    actor: "admin",
    action: "position_update",
    detail: title,
    ip: clientIp(request),
  });
  return NextResponse.json(position);
}

export async function DELETE(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);
  const election = await getElection();
  if (election.status !== "draft") return jsonError("Ballot is locked.");
  const { id } = (await request.json()) as { id?: string };
  if (!id) return jsonError("Missing position id.");
  await prisma.ballotChoice.deleteMany({ where: { positionId: id } });
  await prisma.candidate.deleteMany({ where: { positionId: id } });
  await prisma.position.delete({ where: { id } });
  await writeAudit({
    actor: "admin",
    action: "position_delete",
    detail: id,
    ip: clientIp(request),
  });
  return NextResponse.json({ ok: true });
}
