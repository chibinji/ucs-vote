import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { getElection } from "@/lib/election";
import { clientIp, jsonError } from "@/lib/http";
import { requireAdmin, requireStaff } from "@/lib/staff";

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((part) => part.trim().toLowerCase());
  const computerIdx = header.findIndex((h) =>
    ["computer_number", "computernumber", "computer number"].includes(h),
  );
  const emailIdx = header.findIndex((h) =>
    ["cs_email", "email", "cs email"].includes(h),
  );
  const nameIdx = header.findIndex((h) =>
    ["full_name", "name", "full name"].includes(h),
  );
  if (computerIdx < 0 || emailIdx < 0) {
    throw new Error("CSV must include computer_number and cs_email columns.");
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((part) => part.trim().replace(/^"|"$/g, ""));
    return {
      computerNumber: cols[computerIdx]?.toUpperCase() || "",
      csEmail: cols[emailIdx]?.toLowerCase() || "",
      fullName: nameIdx >= 0 ? cols[nameIdx] || null : null,
    };
  });
}

export async function GET() {
  const { staff, error } = await requireStaff();
  if (!staff) return jsonError(error, 401);
  const voters = await prisma.voter.findMany({
    orderBy: { computerNumber: "asc" },
    select: {
      id: true,
      computerNumber: true,
      csEmail: true,
      fullName: true,
      hasVoted: true,
      votedAt: true,
      deviceLabel: true,
      passwordHash: true,
    },
  });
  return NextResponse.json({
    voters: voters.map(({ passwordHash, ...voter }) => ({
      ...voter,
      hasPassword: Boolean(passwordHash),
    })),
  });
}

export async function POST(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);
  const election = await getElection();
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      computerNumber?: string;
      csEmail?: string;
      fullName?: string;
    };
    const computerNumber = (body.computerNumber || "").trim().toUpperCase();
    const csEmail = (body.csEmail || "").trim().toLowerCase();
    const fullName = body.fullName?.trim() || null;
    if (!computerNumber || !csEmail.includes("@")) {
      return jsonError("Computer number and CS email are required.");
    }
    try {
      const voter = await prisma.voter.create({
        data: { computerNumber, csEmail, fullName },
      });
      await writeAudit({
        actor: "admin",
        action: "voter_create",
        detail: computerNumber,
        ip: clientIp(request),
      });
      return NextResponse.json({ ok: true, voter });
    } catch {
      return jsonError("That computer number or email is already on the list.");
    }
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Upload a CSV file.");
  let rows: ReturnType<typeof parseCsv> = [];
  try {
    rows = parseCsv(await file.text()).filter(
      (row) => row.computerNumber && row.csEmail.includes("@"),
    );
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Could not read CSV.");
  }
  if (rows.length === 0) return jsonError("No valid voter rows found.");

  const domain = (process.env.ALLOWED_EMAIL_DOMAIN || "").toLowerCase();
  const filtered = domain
    ? rows.filter((row) => row.csEmail.endsWith(`@${domain}`) || row.csEmail.endsWith(`.${domain}`))
    : rows;

  if (election.status === "draft") {
    await prisma.voter.deleteMany();
    const CHUNK = 50;
    for (let i = 0; i < filtered.length; i += CHUNK) {
      await prisma.voter.createMany({ data: filtered.slice(i, i + CHUNK) });
    }
  } else {
    const existing = await prisma.voter.findMany({
      select: { computerNumber: true },
    });
    const existingNumbers = new Set(existing.map((row) => row.computerNumber));
    const toCreate = filtered.filter((row) => !existingNumbers.has(row.computerNumber));
    const toUpdate = filtered.filter((row) => existingNumbers.has(row.computerNumber));

    const CHUNK = 50;
    for (let i = 0; i < toCreate.length; i += CHUNK) {
      await prisma.voter.createMany({ data: toCreate.slice(i, i + CHUNK) });
    }

    for (let i = 0; i < toUpdate.length; i += CHUNK) {
      const chunk = toUpdate.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map((row) =>
          prisma.voter.update({
            where: { computerNumber: row.computerNumber },
            data: { fullName: row.fullName },
          }),
        ),
      );
    }
  }

  const created = filtered.length;

  await writeAudit({
    actor: "admin",
    action: "voters_upload",
    detail: `${created} rows`,
    ip: clientIp(request),
  });

  return NextResponse.json({ ok: true, count: created });
}

export async function PATCH(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);
  const body = (await request.json()) as {
    id?: string;
    action?: string;
    computerNumber?: string;
    csEmail?: string;
    fullName?: string;
  };
  if (!body.id) return jsonError("Missing voter id.");
  const voter = await prisma.voter.findUnique({ where: { id: body.id } });
  if (!voter) return jsonError("Voter not found.", 404);

  if (body.action === "reset_password") {
    await prisma.voter.update({
      where: { id: body.id },
      data: { passwordHash: null },
    });
    await writeAudit({
      actor: "admin",
      action: "password_reset",
      detail: voter.computerNumber,
      ip: clientIp(request),
    });
    return NextResponse.json({ ok: true });
  }

  if (voter.hasVoted) return jsonError("Cannot edit a voter who has already voted.");

  try {
    const updated = await prisma.voter.update({
      where: { id: body.id },
      data: {
        computerNumber: (body.computerNumber || voter.computerNumber).trim().toUpperCase(),
        csEmail: (body.csEmail || voter.csEmail).trim().toLowerCase(),
        fullName: body.fullName === undefined ? voter.fullName : body.fullName.trim() || null,
      },
    });
    await writeAudit({
      actor: "admin",
      action: "voter_update",
      detail: updated.computerNumber,
      ip: clientIp(request),
    });
    return NextResponse.json({ ok: true, voter: updated });
  } catch {
    return jsonError("That computer number or email is already on the list.");
  }
}

export async function DELETE(request: Request) {
  const { staff, error } = await requireAdmin();
  if (error) return jsonError(error, staff ? 403 : 401);
  const { id } = (await request.json()) as { id?: string };
  if (!id) return jsonError("Missing voter id.");
  const voter = await prisma.voter.findUnique({ where: { id } });
  if (!voter) return jsonError("Voter not found.", 404);
  if (voter.hasVoted) return jsonError("Cannot remove a voter who has already voted.");
  await prisma.voter.delete({ where: { id } });
  await writeAudit({
    actor: "admin",
    action: "voter_delete",
    detail: voter.computerNumber,
    ip: clientIp(request),
  });
  return NextResponse.json({ ok: true });
}
