import { NextResponse } from "next/server";
import { getLiveSnapshot } from "@/lib/results";
import { jsonError } from "@/lib/http";
import { requireStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

/** Kept for compatibility; prefer GET /api/admin/results with client polling. */
export async function GET() {
  const { staff, error } = await requireStaff();
  if (!staff) return jsonError(error, 401);
  const snapshot = await getLiveSnapshot();
  return NextResponse.json(snapshot);
}
