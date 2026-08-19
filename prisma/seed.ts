import { config } from "dotenv";
config();

async function main() {
  const { getPrisma } = await import("../lib/prisma");
  const prisma = await getPrisma();

  const existing = await prisma.election.findFirst();
  if (existing) {
    console.log("Election already exists:", existing.title);
    return;
  }

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

  console.log("Created election", election.title);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
