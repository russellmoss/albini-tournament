import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groupAssignments,
  groups,
  matches,
  matchResults,
  players,
  type Group,
  type Match,
  type MatchResult,
  type Player,
} from "@/lib/schema";

export type MatchWithPlayers = {
  match: Match;
  playerA: Player;
  playerB: Player;
  results: MatchResult[];
};

export type GroupWithMatches = {
  group: Group;
  players: Player[];
  matches: MatchWithPlayers[];
};

export async function listGroupMatches(
  tournamentId: string,
): Promise<GroupWithMatches[]> {
  const groupRows = await db
    .select()
    .from(groups)
    .where(eq(groups.tournamentId, tournamentId))
    .orderBy(asc(groups.position));

  if (groupRows.length === 0) return [];

  const assignments = await db
    .select({ groupId: groupAssignments.groupId, player: players })
    .from(groupAssignments)
    .innerJoin(players, eq(groupAssignments.playerId, players.id))
    .where(eq(players.tournamentId, tournamentId))
    .orderBy(asc(players.name));

  const playersByGroup = new Map<string, Player[]>();
  for (const a of assignments) {
    const arr = playersByGroup.get(a.groupId) ?? [];
    arr.push(a.player);
    playersByGroup.set(a.groupId, arr);
  }

  const playerA = players;
  const matchRows = await db
    .select()
    .from(matches)
    .where(
      and(eq(matches.tournamentId, tournamentId), eq(matches.phase, "group")),
    )
    .orderBy(asc(matches.id));

  const allResults = await db
    .select()
    .from(matchResults);
  const resultsByMatch = new Map<string, MatchResult[]>();
  for (const r of allResults) {
    const arr = resultsByMatch.get(r.matchId) ?? [];
    arr.push(r);
    resultsByMatch.set(r.matchId, arr);
  }

  const allPlayers = await db
    .select()
    .from(playerA)
    .where(eq(playerA.tournamentId, tournamentId));
  const playersById = new Map(allPlayers.map((p) => [p.id, p]));

  return groupRows.map((g) => {
    const ms = matchRows.filter((m) => m.groupId === g.id);
    return {
      group: g,
      players: playersByGroup.get(g.id) ?? [],
      matches: ms.flatMap((match) => {
        if (!match.playerAId || !match.playerBId) return [];
        const pa = playersById.get(match.playerAId);
        const pb = playersById.get(match.playerBId);
        if (!pa || !pb) return [];
        return [
          {
            match,
            playerA: pa,
            playerB: pb,
            results: resultsByMatch.get(match.id) ?? [],
          },
        ];
      }),
    };
  });
}
