import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import {
  groupAssignments,
  groups,
  matches,
  players,
  tournaments,
} from "../lib/schema";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, {
    schema: { tournaments, players, groups, groupAssignments, matches },
  });

  const [t] = await db.select().from(tournaments).limit(1);
  if (!t) {
    console.log("No tournament to reset");
    return;
  }

  await db.delete(matches).where(eq(matches.tournamentId, t.id));
  await db
    .delete(groupAssignments)
    .where(
      eq(
        groupAssignments.groupId,
        db.select({ id: groups.id }).from(groups).where(eq(groups.tournamentId, t.id)) as never,
      ),
    )
    .catch(() => {
      /* fallback below */
    });
  const groupRows = await db.select().from(groups).where(eq(groups.tournamentId, t.id));
  for (const g of groupRows) {
    await db.delete(groupAssignments).where(eq(groupAssignments.groupId, g.id));
  }
  await db.delete(groups).where(eq(groups.tournamentId, t.id));
  await db.delete(players).where(eq(players.tournamentId, t.id));
  await db
    .update(tournaments)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(tournaments.id, t.id));

  console.log(`Reset tournament ${t.id} to draft`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
