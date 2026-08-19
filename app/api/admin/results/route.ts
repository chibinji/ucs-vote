import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getLiveSnapshot } from "@/lib/results";
import { requireStaff } from "@/lib/staff";

export async function GET() {
  const { staff, error } = await requireStaff();
  if (!staff) return jsonError(error, 401);
  return NextResponse.json(await getLiveSnapshot());
}
