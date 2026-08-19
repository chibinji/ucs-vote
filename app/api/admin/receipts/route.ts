import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/crypto";
import { jsonError } from "@/lib/http";
import { requireStaff } from "@/lib/staff";

export async function POST(request: Request) {
  const { staff, error } = await requireStaff();
  if (!staff) return jsonError(error, 401);
  const { code } = (await request.json()) as { code?: string };
  if (!code) return jsonError("Receipt code required.");
  const ballot = await prisma.ballot.findUnique({
    where: { receiptHash: sha256(code.trim().toUpperCase()) },
    select: { createdAt: true, deviceType: true },
  });
  if (!ballot) return NextResponse.json({ found: false });
  return NextResponse.json({
    found: true,
    at: ballot.createdAt.toISOString(),
    deviceType: ballot.deviceType,
  });
}
