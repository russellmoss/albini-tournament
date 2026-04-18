import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import { matchResults, matches, tournaments } from "../lib/schema";
import { downstreamSlot } from "../lib/tournament/bracket";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema: { matches, matchResults, tournaments } });

  const [t] = await db.select().from(tournaments).limit(1);
  if (!t) throw new Error("No tournament");

  async function playOne(phase: "qf" | "sf" | "final") {
    const pending = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.tournamentId, t!.id),
          eq(matches.phase, phase),
          eq(matches.status, "pending"),
        ),
      );
    let played = 0;
    for (const m of pending) {
      if (!m.playerAId || !m.playerBId) continue;
      const winnerIsA = m.playerAId < m.playerBId;
      const winnerPoints = 20;
      const loserPoints = 14;
      await db.insert(matchResults).values([
        {
          matchId: m.id,
          playerId: m.playerAId,
          points: winnerIsA ? winnerPoints : loserPoints,
          won: winnerIsA,
        },
        {
          matchId: m.id,
          playerId: m.playerBId,
          points: winnerIsA ? loserPoints : winnerPoints,
          won: !winnerIsA,
        },
      ]);
      await db
        .update(matches)
        .set({ status: "done", playedAt: new Date() })
        .where(eq(matches.id, m.id));

      if (m.bracketSlot != null) {
        const target = downstreamSlot(m.bracketSlot);
        if (target) {
          const [downstream] = await db
            .select()
            .from(matches)
            .where(
              and(
                eq(matches.tournamentId, t!.id),
                eq(matches.bracketSlot, target.slot),
              ),
            )
            .limit(1);
          if (downstream) {
            const winnerId = winnerIsA ? m.playerAId : m.playerBId;
            const patch =
              target.side === "a"
                ? { playerAId: winnerId }
                : { playerBId: winnerId };
            await db.update(matches).set(patch).where(eq(matches.id, downstream.id));
          }
        }
      }
      played += 1;
    }
    return played;
  }

  const qf = await playOne("qf");
  const sf = await playOne("sf");
  const fin = await playOne("final");

  await db
    .update(tournaments)
    .set({ status: "done", updatedAt: new Date() })
    .where(
      and(eq(tournaments.id, t.id), eq(tournaments.status, "knockout")),
    );

  console.log(`Played ${qf} QFs, ${sf} SFs, ${fin} Final; tournament → done`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
