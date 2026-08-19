import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sixDigitCode, sha256 } from "@/lib/crypto";
import { sendOtpEmail } from "@/lib/email";
import { getElection } from "@/lib/election";
import { recordBlock, writeAudit } from "@/lib/audit";
import { clientIp, deviceTypeFromLabel, jsonError } from "@/lib/http";
import { hitRateLimit } from "@/lib/rate-limit";
import { getDeviceToken, setVoteDoneCookie } from "@/lib/session";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await hitRateLimit(`vote-login:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) return jsonError("Too many attempts. Try again in 15 minutes.", 429);

  const body = (await request.json()) as {
    computerNumber?: string;
    csEmail?: string;
    fingerprint?: string;
    deviceLabel?: string;
  };

  const computerNumber = (body.computerNumber || "").trim().toUpperCase();
  const csEmail = (body.csEmail || "").trim().toLowerCase();
  if (!computerNumber || !csEmail) {
    return jsonError("Computer number and CS email are required.");
  }

  const election = await getElection();
  if (election.status !== "open") {
    return jsonError(
      election.status === "closed"
        ? "Voting has ended."
        : "Voting is not open yet.",
    );
  }

  const voter = await prisma.voter.findFirst({
    where: { computerNumber, csEmail },
  });
  if (!voter) {
    await recordBlock("invalid_login", ip, deviceTypeFromLabel(body.deviceLabel));
    await writeAudit({ actor: "voter", action: "login_rejected", ip });
    return jsonError("You are not on the registered voter list.", 403);
  }

  const cookieToken = await getDeviceToken();
  if (voter.deviceTokenHash) {
    const cookieOk = cookieToken && sha256(cookieToken) === voter.deviceTokenHash;
    const fingerprintOk =
      body.fingerprint && voter.deviceFingerprint === body.fingerprint;
    if (!cookieOk && !fingerprintOk) {
      await recordBlock("device_mismatch", ip, deviceTypeFromLabel(body.deviceLabel));
      await writeAudit({
        actor: "voter",
        action: "device_blocked",
        detail: voter.computerNumber,
        ip,
      });
      return jsonError(
        "This account is bound to another device. Ask an admin to reset your device if you have a genuine reason.",
        403,
      );
    }
  }

  if (voter.hasVoted) {
    await setVoteDoneCookie();
    await writeAudit({ actor: "voter", action: "login_already_voted", ip });
    return NextResponse.json({ ok: true, alreadyVoted: true });
  }

  const emailLimit = await hitRateLimit(`otp:${voter.id}`, 5, 15 * 60 * 1000);
  if (!emailLimit.ok) return jsonError("Too many codes sent. Wait 15 minutes.", 429);

  const code = sixDigitCode();
  await prisma.otpCode.updateMany({
    where: { voterId: voter.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.otpCode.create({
    data: {
      voterId: voter.id,
      codeHash: sha256(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  let mailed: { delivered: boolean; preview: boolean };
  try {
    mailed = await sendOtpEmail(voter.csEmail, code);
  } catch (err) {
    return jsonError(
      err instanceof Error
        ? `Could not send email: ${err.message}`
        : "Could not send the verification email.",
      502,
    );
  }
  await writeAudit({ actor: "voter", action: "otp_sent", ip });

  return NextResponse.json({
    ok: true,
    otpRequired: true,
    preview: mailed.preview,
    deviceLabel: body.deviceLabel || null,
  });
}
