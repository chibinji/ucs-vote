import { prisma } from "@/lib/prisma";

export async function writeAudit(input: {
  actor: string;
  action: string;
  detail?: string;
  ip?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actor: input.actor,
      action: input.action,
      detail: input.detail,
      ip: input.ip,
    },
  });
}

export async function recordBlock(kind: string, ip?: string, deviceType?: string) {
  await prisma.blockedAttempt.create({
    data: { kind, ip, deviceType },
  });
}
