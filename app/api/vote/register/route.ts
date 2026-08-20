import { randomToken, sha256, hashPassword } from "@/lib/crypto";
import { writeAudit, recordBlock } from "@/lib/audit";
import { getElection } from "@/lib/election";
import { clientIp, deviceTypeFromLabel, jsonError } from "@/lib/http";
import { hitRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import {
  getDeviceToken,
  setDeviceCookie,
  setVoteDoneCookie,
  setVoterSession,
} from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await hitRateLimit(`vote-register:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) return jsonError("Too many attempts. Try again in 15 minutes.", 429);

  const body = (await request.json()) as {
    computerNumber?: string;
    csEmail?: string;
    password?: string;
    fingerprint?: string;
    deviceLabel?: string;
  };

  const computerNumber = (body.computerNumber || "").trim().toUpperCase();
  const csEmail = (body.csEmail || "").trim().toLowerCase();
  const password = body.password || "";

  if (!computerNumber || !csEmail) {
    return jsonError("Computer number and CS email are required.");
  }
  if (password.length < 8) {
    return jsonError("Password must be at least 8 characters.");
  }

  const election = await getElection();
  if (election.status !== "open") {
    return jsonError(
      election.status === "closed" ? "Voting has ended." : "Voting is not open yet.",
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

  if (voter.passwordHash) {
    return jsonError(
      "This account already has a password. Sign in with your CS email and password.",
      409,
    );
  }

  const deviceToken = (await getDeviceToken()) || randomToken();
  await prisma.voter.update({
    where: { id: voter.id },
    data: {
      passwordHash: hashPassword(password),
      deviceTokenHash: sha256(deviceToken),
      deviceFingerprint: body.fingerprint || null,
      deviceLabel: body.deviceLabel || null,
    },
  });
  await setDeviceCookie(deviceToken);
  await setVoterSession(voter.id);

  if (voter.hasVoted) {
    await setVoteDoneCookie();
    await writeAudit({ actor: "voter", action: "login_already_voted", ip });
    return NextResponse.json({ ok: true, alreadyVoted: true });
  }

  await writeAudit({
    actor: "voter",
    action: "account_created",
    detail: voter.computerNumber,
    ip,
  });
  return NextResponse.json({ ok: true, hasVoted: false });
}
