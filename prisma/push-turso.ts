import { config } from "dotenv";
config();
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

const client = createClient({ url, authToken });

const statements = [
  `CREATE TABLE IF NOT EXISTS "Election" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "openedAt" DATETIME, "closedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "Position" ("id" TEXT NOT NULL PRIMARY KEY, "electionId" TEXT NOT NULL, "title" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "Position_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS "Candidate" ("id" TEXT NOT NULL PRIMARY KEY, "positionId" TEXT NOT NULL, "name" TEXT NOT NULL, "photoMime" TEXT, "photoData" BLOB, "sortOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "Candidate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS "Voter" ("id" TEXT NOT NULL PRIMARY KEY, "computerNumber" TEXT NOT NULL, "csEmail" TEXT NOT NULL, "fullName" TEXT, "passwordHash" TEXT, "hasVoted" BOOLEAN NOT NULL DEFAULT false, "votedAt" DATETIME, "deviceTokenHash" TEXT, "deviceFingerprint" TEXT, "deviceLabel" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "Ballot" ("id" TEXT NOT NULL PRIMARY KEY, "receiptHash" TEXT NOT NULL, "deviceType" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "BallotChoice" ("id" TEXT NOT NULL PRIMARY KEY, "ballotId" TEXT NOT NULL, "positionId" TEXT NOT NULL, "candidateId" TEXT NOT NULL, CONSTRAINT "BallotChoice_ballotId_fkey" FOREIGN KEY ("ballotId") REFERENCES "Ballot" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "BallotChoice_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "BallotChoice_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS "AuditLog" ("id" TEXT NOT NULL PRIMARY KEY, "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "actor" TEXT NOT NULL, "action" TEXT NOT NULL, "detail" TEXT, "ip" TEXT)`,
  `CREATE TABLE IF NOT EXISTS "RateLimit" ("id" TEXT NOT NULL PRIMARY KEY, "count" INTEGER NOT NULL, "resetAt" DATETIME NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "BlockedAttempt" ("id" TEXT NOT NULL PRIMARY KEY, "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "kind" TEXT NOT NULL, "ip" TEXT, "deviceType" TEXT)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Voter_computerNumber_key" ON "Voter"("computerNumber")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Voter_csEmail_key" ON "Voter"("csEmail")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Ballot_receiptHash_key" ON "Ballot"("receiptHash")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "BallotChoice_ballotId_positionId_key" ON "BallotChoice"("ballotId", "positionId")`,
];

async function run() {
  console.log("Pushing schema to Turso...");
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      const name = stmt.match(/"(\w+)"/)?.[1] || "?";
      console.log("  OK:", name);
    } catch (e: any) {
      console.error("  FAIL:", e.message);
    }
  }
  console.log("Done.");
  process.exit(0);
}

run();
