import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, tournaments, type Player, type Tournament } from "@/lib/schema";

export async function getActiveTournament(): Promise<Tournament | null> {
  const rows = await db
    .select()
    .from(tournaments)
    .orderBy(asc(tournaments.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getActiveTournamentOrThrow(): Promise<Tournament> {
  const t = await getActiveTournament();
  if (!t) throw new Error("No active tournament");
  return t;
}

export async function listPlayers(tournamentId: string): Promise<Player[]> {
  return db
    .select()
    .from(players)
    .where(eq(players.tournamentId, tournamentId))
    .orderBy(asc(players.registeredAt));
}
