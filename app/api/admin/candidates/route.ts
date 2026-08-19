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
  if (election.status !== "draft") return jsonError("Ballot is locked.");

  const form = await request.formData();
  const positionId = String(form.get("positionId") || "");
  const name = String(form.get("name") || "").trim();
  const photo = form.get("photo");
  if (!positionId || !name) return jsonError("Name and position are required.");

  const count = await prisma.candidate.count({ where: { positionId } });
  const photoBytes =
    photo instanceof File && photo.size > 0
      ? (new Uint8Array(await photo.arrayBuffer()) as Uint8Array<ArrayBuffer>)
      : undefined;

  const candidate = await prisma.candidate.create({
    data: {
      positionId,
      name,
      sortOrder: count + 1,
      photoMime: photoBytes ? photo instanceof File ? photo.type || "image/jpeg" : "image/jpeg" : undefined,
      photoData: photoBytes,
    },
  });
  await writeAudit({
    actor: "admin",
    action: "candidate_create",
    detail: name,
    ip: clientIp(request),
  });
  return NextResponse.json({ id: candidate.id, name: candidate.name });
}

export async function PATCH(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const name = String(form.get("name") || "").trim();
  const photo = form.get("photo");
  if (!id) return jsonError("Missing candidate id.");

  const data: {
    name?: string;
    photoMime?: string;
    photoData?: Uint8Array<ArrayBuffer>;
  } = {};
  if (name) data.name = name;
  if (photo instanceof File && photo.size > 0) {
    data.photoMime = photo.type || "image/jpeg";
    data.photoData = new Uint8Array(await photo.arrayBuffer()) as Uint8Array<ArrayBuffer>;
  }
  if (!data.name && !data.photoData) return jsonError("Provide a name or photo to update.");

  const election = await getElection();
  if (data.name && election.status !== "draft") return jsonError("Ballot is locked.");

  await prisma.candidate.update({ where: { id }, data });
  await writeAudit({
    actor: "admin",
    action: data.photoData ? "candidate_photo" : "candidate_update",
    detail: name || id,
    ip: clientIp(request),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);
  const election = await getElection();
  if (election.status !== "draft") return jsonError("Ballot is locked.");
  const { id } = (await request.json()) as { id?: string };
  if (!id) return jsonError("Missing candidate id.");
  await prisma.ballotChoice.deleteMany({ where: { candidateId: id } });
  await prisma.candidate.delete({ where: { id } });
  await writeAudit({
    actor: "admin",
    action: "candidate_delete",
    detail: id,
    ip: clientIp(request),
  });
  return NextResponse.json({ ok: true });
}
