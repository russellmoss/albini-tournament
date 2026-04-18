import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groupAssignments,
  groups,
  matches,
  matchResults,
  players,
  type Match,
  type MatchResult,
  type Player,
} from "@/lib/schema";

export type PathStep = {
  label: string;
  opponent: string;
  championPoints: number;
  opponentPoints: number;
  suddenDeath: boolean;
};

export type PathToVictory = {
  champion: Player;
  group: {
    name: string;
    position: number;
    wins: number;
    losses: number;
  } | null;
  steps: PathStep[];
};

function stepLabel(phase: string, slot: number | null): string {
  if (phase === "qf") return `QF`;
  if (phase === "sf") return `SF`;
  if (phase === "final") return `Final`;
  return phase;
}

export async function getPathToVictory(
  tournamentId: string,
): Promise<PathToVictory | null> {
  const [finalMatch] = await db
    .select()
    .from(matches)
    .where(
      and(eq(matches.tournamentId, tournamentId), eq(matches.phase, "final")),
    )
    .limit(1);

  if (!finalMatch || finalMatch.status !== "done") return null;

  const finalResults = await db
    .select()
    .from(matchResults)
    .where(eq(matchResults.matchId, finalMatch.id));

  const winnerResult = finalResults.find((r) => r.won);
  if (!winnerResult) return null;

  const [champion] = await db
    .select()
    .from(players)
    .where(eq(players.id, winnerResult.playerId))
    .limit(1);
  if (!champion) return null;

  const allPlayers = await db
    .select()
    .from(players)
    .where(eq(players.tournamentId, tournamentId));
  const playersById = new Map(allPlayers.map((p) => [p.id, p]));

  const [assignment] = await db
    .select()
    .from(groupAssignments)
    .where(eq(groupAssignments.playerId, champion.id))
    .limit(1);

  let groupInfo: PathToVictory["group"] = null;
  if (assignment) {
    const [g] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, assignment.groupId))
      .limit(1);
    if (g) {
      const groupMatches = await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.tournamentId, tournamentId),
            eq(matches.phase, "group"),
            eq(matches.groupId, g.id),
          ),
        );
      const groupMatchIds = groupMatches.map((m) => m.id);
      const groupResultsAll = await db.select().from(matchResults);
      const championGroupResults = groupResultsAll.filter(
        (r) =>
          groupMatchIds.includes(r.matchId) && r.playerId === champion.id,
      );
      const wins = championGroupResults.filter((r) => r.won).length;
      const losses = championGroupResults.filter((r) => !r.won).length;
      groupInfo = {
        name: g.name,
        position: g.position,
        wins,
        losses,
      };
    }
  }

  const knockoutMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournamentId),
        eq(matches.status, "done"),
      ),
    )
    .orderBy(asc(matches.bracketSlot));

  const championKnockout = knockoutMatches.filter(
    (m) =>
      m.phase !== "group" &&
      (m.playerAId === champion.id || m.playerBId === champion.id),
  );

  const allResults = await db.select().from(matchResults);
  const resultsByMatch = new Map<string, MatchResult[]>();
  for (const r of allResults) {
    const arr = resultsByMatch.get(r.matchId) ?? [];
    arr.push(r);
    resultsByMatch.set(r.matchId, arr);
  }

  const steps: PathStep[] = championKnockout
    .slice()
    .sort((a, b) => phaseOrder(a) - phaseOrder(b))
    .flatMap((m: Match) => {
      const rs = resultsByMatch.get(m.id) ?? [];
      const championR = rs.find((r) => r.playerId === champion.id);
      const opponentR = rs.find((r) => r.playerId !== champion.id);
      if (!championR || !opponentR) return [];
      const opponent = playersById.get(opponentR.playerId);
      if (!opponent) return [];
      return [
        {
          label: stepLabel(m.phase, m.bracketSlot),
          opponent: opponent.name,
          championPoints: championR.points,
          opponentPoints: opponentR.points,
          suddenDeath: m.wentToSuddenDeath,
        },
      ];
    });

  return { champion, group: groupInfo, steps };
}

function phaseOrder(m: Match): number {
  if (m.phase === "qf") return 0;
  if (m.phase === "sf") return 1;
  if (m.phase === "final") return 2;
  return 99;
}
