import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groups,
  matches,
  players,
  type Group,
  type Match,
  type Player,
} from "@/lib/schema";

export type UpNextMatch = {
  match: Match;
  playerA: Player;
  playerB: Player;
  group: Group | null;
  label: string;
};

const PHASE_RANK: Record<string, number> = {
  group: 0,
  qf: 1,
  sf: 2,
  final: 3,
};

function phaseRank(phase: string): number {
  return PHASE_RANK[phase] ?? 99;
}

function computeLabel(match: Match, group: Group | null): string {
  if (match.phase === "group") {
    return group ? `Group ${group.position} · ${group.name}` : "Group match";
  }
  if (match.phase === "qf") return `QF${match.bracketSlot ?? ""}`;
  if (match.phase === "sf") {
    const slot = match.bracketSlot ?? 5;
    return `SF${slot - 4}`;
  }
  if (match.phase === "final") return "Final";
  return match.phase;
}

export async function getUpNextMatch(
  tournamentId: string,
): Promise<UpNextMatch | null> {
  const pending = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournamentId),
        eq(matches.status, "pending"),
        isNotNull(matches.playerAId),
        isNotNull(matches.playerBId),
      ),
    );

  if (pending.length === 0) return null;

  pending.sort((a, b) => {
    const pa = phaseRank(a.phase);
    const pb = phaseRank(b.phase);
    if (pa !== pb) return pa - pb;
    const sa = a.bracketSlot ?? Number.POSITIVE_INFINITY;
    const sb = b.bracketSlot ?? Number.POSITIVE_INFINITY;
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });

  const winner = pending[0];
  if (!winner.playerAId || !winner.playerBId) return null;

  const [playerA] = await db
    .select()
    .from(players)
    .where(eq(players.id, winner.playerAId))
    .limit(1);
  const [playerB] = await db
    .select()
    .from(players)
    .where(eq(players.id, winner.playerBId))
    .limit(1);
  if (!playerA || !playerB) return null;

  let group: Group | null = null;
  if (winner.groupId) {
    const [g] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, winner.groupId))
      .limit(1);
    group = g ?? null;
  }

  return {
    match: winner,
    playerA,
    playerB,
    group,
    label: computeLabel(winner, group),
  };
}
