import { config } from "dotenv";
config();
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;
const client = createClient({ url, authToken });

async function run() {
  console.log("Migrating Turso schema for password auth...");
  try {
    await client.execute(`ALTER TABLE "Voter" ADD COLUMN "passwordHash" TEXT`);
    console.log("  OK: added passwordHash");
  } catch (e: any) {
    if (String(e.message).includes("duplicate column") || String(e.message).includes("already exists")) {
      console.log("  SKIP: passwordHash already exists");
    } else {
      console.error("  FAIL passwordHash:", e.message);
    }
  }

  try {
    await client.execute(`DROP TABLE IF EXISTS "OtpCode"`);
    console.log("  OK: dropped OtpCode");
  } catch (e: any) {
    console.error("  FAIL drop OtpCode:", e.message);
  }

  console.log("Done.");
  process.exit(0);
}

run();
