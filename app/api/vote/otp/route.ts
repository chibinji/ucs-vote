import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomToken, sha256 } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { clientIp, jsonError } from "@/lib/http";
import { hitRateLimit } from "@/lib/rate-limit";
import { getDeviceToken, setDeviceCookie, setVoteDoneCookie, setVoterSession } from "@/lib/session";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await hitRateLimit(`otp-try:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) return jsonError("Too many attempts.", 429);

  const body = (await request.json()) as {
    computerNumber?: string;
    csEmail?: string;
    code?: string;
    fingerprint?: string;
    deviceLabel?: string;
  };

  const computerNumber = (body.computerNumber || "").trim().toUpperCase();
  const csEmail = (body.csEmail || "").trim().toLowerCase();
  const code = (body.code || "").trim();
  if (!computerNumber || !csEmail || !code) {
    return jsonError("Enter the 6-digit code sent to your CS email.");
  }

  const voter = await prisma.voter.findFirst({
    where: { computerNumber, csEmail },
  });
  if (!voter) return jsonError("You are not on the registered voter list.", 403);

  const otp = await prisma.otpCode.findFirst({
    where: { voterId: voter.id, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt < new Date()) {
    return jsonError("That code has expired. Request a new one.");
  }
  if (otp.attempts >= 5) {
    return jsonError("Too many incorrect codes. Request a new one.");
  }
  if (otp.codeHash !== sha256(code)) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return jsonError("Incorrect code.", 401);
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  let deviceToken = await getDeviceToken();
  if (!voter.deviceTokenHash) {
    deviceToken = deviceToken || randomToken();
    await prisma.voter.update({
      where: { id: voter.id },
      data: {
        deviceTokenHash: sha256(deviceToken),
        deviceFingerprint: body.fingerprint || null,
        deviceLabel: body.deviceLabel || null,
      },
    });
    await setDeviceCookie(deviceToken);
  } else if (deviceToken) {
    await setDeviceCookie(deviceToken);
  }

  await setVoterSession(voter.id);
  if (voter.hasVoted) await setVoteDoneCookie();
  await writeAudit({ actor: "voter", action: "login_ok", ip });
  return NextResponse.json({ ok: true, hasVoted: voter.hasVoted });
}
