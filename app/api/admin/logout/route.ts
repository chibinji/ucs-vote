import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/http";
import { clearStaffSession, getStaffSession } from "@/lib/session";

export async function POST(request: Request) {
  const staff = await getStaffSession();
  await clearStaffSession();
  if (staff) {
    await writeAudit({
      actor: staff.role,
      action: "staff_logout",
      ip: clientIp(request),
    });
  }
  return NextResponse.json({ ok: true });
}
