import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeEqual } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { clientIp, jsonError } from "@/lib/http";
import { hitRateLimit } from "@/lib/rate-limit";
import { setStaffSession } from "@/lib/session";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await hitRateLimit(`staff-login:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) return jsonError("Too many attempts. Try again later.", 429);

  const body = (await request.json()) as { password?: string };
  const password = body.password || "";
  const admin = process.env.ADMIN_PASSWORD || "";
  const observer = process.env.OBSERVER_PASSWORD || "";

  let role: "admin" | "observer" | null = null;
  if (admin && safeEqual(password, admin)) role = "admin";
  else if (observer && safeEqual(password, observer)) role = "observer";

  if (!role) {
    await writeAudit({ actor: "unknown", action: "staff_login_failed", ip });
    return jsonError("Incorrect password.", 401);
  }

  await setStaffSession(role);
  await writeAudit({ actor: role, action: "staff_login", ip });
  return NextResponse.json({ ok: true, role });
}
