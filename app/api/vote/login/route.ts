import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256, verifyPassword } from "@/lib/crypto";
import { getElection } from "@/lib/election";
import { recordBlock, writeAudit } from "@/lib/audit";
import { clientIp, deviceTypeFromLabel, jsonError } from "@/lib/http";
import { hitRateLimit } from "@/lib/rate-limit";
import {
  getDeviceToken,
  setDeviceCookie,
  setVoteDoneCookie,
  setVoterSession,
} from "@/lib/session";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await hitRateLimit(`vote-login:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) return jsonError("Too many attempts. Try again in 15 minutes.", 429);

  const body = (await request.json()) as {
    csEmail?: string;
    password?: string;
    fingerprint?: string;
    deviceLabel?: string;
  };

  const csEmail = (body.csEmail || "").trim().toLowerCase();
  const password = body.password || "";
  if (!csEmail || !password) {
    return jsonError("CS email and password are required.");
  }

  const election = await getElection();
  if (election.status !== "open") {
    return jsonError(
      election.status === "closed" ? "Voting has ended." : "Voting is not open yet.",
    );
  }

  const voter = await prisma.voter.findFirst({ where: { csEmail } });
  if (!voter || !voter.passwordHash) {
    await recordBlock("invalid_login", ip, deviceTypeFromLabel(body.deviceLabel));
    await writeAudit({ actor: "voter", action: "login_rejected", ip });
    return jsonError(
      voter && !voter.passwordHash
        ? "Create your password first using your computer number and CS email."
        : "Incorrect email or password.",
      403,
    );
  }

  if (!verifyPassword(password, voter.passwordHash)) {
    await recordBlock("invalid_login", ip, deviceTypeFromLabel(body.deviceLabel));
    await writeAudit({ actor: "voter", action: "login_rejected", ip });
    return jsonError("Incorrect email or password.", 401);
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
    if (cookieToken) await setDeviceCookie(cookieToken);
  }

  await setVoterSession(voter.id);

  if (voter.hasVoted) {
    await setVoteDoneCookie();
    await writeAudit({ actor: "voter", action: "login_already_voted", ip });
    return NextResponse.json({ ok: true, alreadyVoted: true });
  }

  await writeAudit({ actor: "voter", action: "login_ok", ip });
  return NextResponse.json({ ok: true, hasVoted: false });
}
