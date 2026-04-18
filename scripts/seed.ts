import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { tournaments } from "../lib/schema";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema: { tournaments } });

  const name = "First Inaugural Albini Invitational";

  const existing = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.name, name))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Tournament already exists: ${existing[0].id}`);
    return;
  }

  const [row] = await db
    .insert(tournaments)
    .values({
      name,
      status: "draft",
      config: {
        group_count: 3,
        group_size: 5,
        advance_top: 2,
        wildcard_count: 2,
      },
    })
    .returning();

  console.log(`Seeded tournament: ${row.id} (${row.name}, ${row.status})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
