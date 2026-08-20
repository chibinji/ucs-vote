import { config } from "dotenv";
config();

async function reset() {
  const { getPrisma } = await import("../lib/prisma");
  const prisma = await getPrisma();

  await prisma.ballotChoice.deleteMany();
  await prisma.ballot.deleteMany();
  await prisma.blockedAttempt.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.voter.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.position.deleteMany();
  await prisma.election.deleteMany();

  const election = await prisma.election.create({
    data: {
      title: "UCS Election",
      status: "draft",
      positions: {
        create: [
          { title: "President", sortOrder: 1 },
          { title: "Vice President", sortOrder: 2 },
          { title: "Secretary", sortOrder: 3 },
        ],
      },
    },
  });

  console.log("Reset complete. Fresh election:", election.title);
  await prisma.$disconnect();
}

reset().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
