import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import { matchResults, matches, tournaments } from "../lib/schema";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema: { matches, matchResults, tournaments } });

  const [t] = await db.select().from(tournaments).limit(1);
  if (!t) throw new Error("No tournament");

  const pending = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, t.id),
        eq(matches.phase, "group"),
        eq(matches.status, "pending"),
      ),
    );

  for (const m of pending) {
    if (!m.playerAId || !m.playerBId) continue;

    const aBetter = m.playerAId < m.playerBId;
    const winner = aBetter ? m.playerAId : m.playerBId;
    const winnerPoints = 20;
    const loserPoints = 10 + (aBetter ? 0 : 2);

    await db.insert(matchResults).values([
      {
        matchId: m.id,
        playerId: m.playerAId,
        points: m.playerAId === winner ? winnerPoints : loserPoints,
        won: m.playerAId === winner,
      },
      {
        matchId: m.id,
        playerId: m.playerBId,
        points: m.playerBId === winner ? winnerPoints : loserPoints,
        won: m.playerBId === winner,
      },
    ]);
    await db
      .update(matches)
      .set({ status: "done", playedAt: new Date() })
      .where(eq(matches.id, m.id));
  }

  console.log(`Posted results for ${pending.length} group matches`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
