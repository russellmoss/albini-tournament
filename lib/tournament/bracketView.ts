import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matches,
  matchResults,
  players,
  type Match,
  type MatchResult,
  type Player,
} from "@/lib/schema";

export type BracketMatchView = {
  match: Match;
  playerA: Player | null;
  playerB: Player | null;
  results: MatchResult[];
};

const PHASE_ORDER: Record<string, number> = {
  qf: 0,
  sf: 1,
  final: 2,
};

export async function listBracketMatches(
  tournamentId: string,
): Promise<BracketMatchView[]> {
  const bracketRows = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournamentId),
        inArray(matches.phase, ["qf", "sf", "final"]),
      ),
    )
    .orderBy(asc(matches.bracketSlot));

  if (bracketRows.length === 0) return [];

  const allPlayers = await db
    .select()
    .from(players)
    .where(eq(players.tournamentId, tournamentId));
  const playersById = new Map(allPlayers.map((p) => [p.id, p]));

  const allResults = await db.select().from(matchResults);
  const resultsByMatch = new Map<string, MatchResult[]>();
  for (const r of allResults) {
    const arr = resultsByMatch.get(r.matchId) ?? [];
    arr.push(r);
    resultsByMatch.set(r.matchId, arr);
  }

  return bracketRows
    .slice()
    .sort((a, b) => {
      const pa = PHASE_ORDER[a.phase] ?? 99;
      const pb = PHASE_ORDER[b.phase] ?? 99;
      if (pa !== pb) return pa - pb;
      return (a.bracketSlot ?? 0) - (b.bracketSlot ?? 0);
    })
    .map((match) => ({
      match,
      playerA: match.playerAId ? playersById.get(match.playerAId) ?? null : null,
      playerB: match.playerBId ? playersById.get(match.playerBId) ?? null : null,
      results: resultsByMatch.get(match.id) ?? [],
    }));
}

export function slotLabel(phase: string, slot: number | null): string {
  if (phase === "qf") return `QF${slot}`;
  if (phase === "sf") return `SF${(slot ?? 5) - 4}`;
  if (phase === "final") return "Final";
  return phase;
}
