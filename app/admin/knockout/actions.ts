"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groupAssignments,
  groups,
  matches,
  matchResults,
  players,
  tournaments,
} from "@/lib/schema";
import {
  rankGroup,
  type HeadToHeadMatch,
  type StandingRow,
} from "@/lib/tournament/standings";
import {
  selectQualifiers,
  type GroupStanding,
} from "@/lib/tournament/wildcards";
import { seedBracket } from "@/lib/tournament/bracket";
import { getActiveTournamentOrThrow } from "@/lib/tournament/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function computeGroupStandings(
  tournamentId: string,
): Promise<GroupStanding[]> {
  const groupRows = await db
    .select()
    .from(groups)
    .where(eq(groups.tournamentId, tournamentId))
    .orderBy(asc(groups.position));

  const assignments = await db
    .select({ groupId: groupAssignments.groupId, player: players })
    .from(groupAssignments)
    .innerJoin(players, eq(groupAssignments.playerId, players.id))
    .where(eq(players.tournamentId, tournamentId));

  const playersByGroup = new Map<string, string[]>();
  for (const a of assignments) {
    const arr = playersByGroup.get(a.groupId) ?? [];
    arr.push(a.player.id);
    playersByGroup.set(a.groupId, arr);
  }

  const groupMatches = await db
    .select()
    .from(matches)
    .where(
      and(eq(matches.tournamentId, tournamentId), eq(matches.phase, "group")),
    );

  const results = await db.select().from(matchResults);
  const resultsByMatch = new Map<string, typeof results>();
  for (const r of results) {
    const arr = resultsByMatch.get(r.matchId) ?? [];
    arr.push(r);
    resultsByMatch.set(r.matchId, arr);
  }

  return groupRows.map((g) => {
    const groupPlayers = playersByGroup.get(g.id) ?? [];
    const groupMatchRows = groupMatches.filter(
      (m) => m.groupId === g.id && m.status === "done",
    );
    const h2hMatches: HeadToHeadMatch[] = groupMatchRows.flatMap((m) => {
      if (!m.playerAId || !m.playerBId) return [];
      const rs = resultsByMatch.get(m.id) ?? [];
      const a = rs.find((r) => r.playerId === m.playerAId);
      const b = rs.find((r) => r.playerId === m.playerBId);
      if (!a || !b) return [];
      return [
        {
          playerAId: m.playerAId,
          playerBId: m.playerBId,
          playerAPoints: a.points,
          playerBPoints: b.points,
        },
      ];
    });
    const standings: StandingRow[] = rankGroup({
      playerIds: groupPlayers,
      matches: h2hMatches,
      seedInputs: [tournamentId, ...groupPlayers],
    });
    return { groupId: g.id, groupPosition: g.position, standings };
  });
}

export async function startKnockout(): Promise<ActionResult> {
  const tournament = await getActiveTournamentOrThrow();
  if (tournament.status !== "group_play") {
    return { ok: false, error: "Tournament is not in group play" };
  }

  const pendingCount = await db
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournament.id),
        eq(matches.phase, "group"),
        eq(matches.status, "pending"),
      ),
    );
  if (pendingCount.length > 0) {
    return {
      ok: false,
      error: `${pendingCount.length} group match${pendingCount.length === 1 ? "" : "es"} still pending`,
    };
  }

  const groupStandings = await computeGroupStandings(tournament.id);

  let qualifiers;
  try {
    qualifiers = selectQualifiers({
      groups: groupStandings,
      advanceTop: tournament.config.advance_top,
      wildcardCount: tournament.config.wildcard_count,
      seedInputs: [tournament.id, "wildcards"],
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Wildcard selection failed",
    };
  }

  const allQualifiers = [...qualifiers.groupWinners, ...qualifiers.wildcards];

  let bracket;
  try {
    bracket = seedBracket({
      qualifiers: allQualifiers,
      seedInputs: [tournament.id, "bracket"],
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bracket seeding failed",
    };
  }

  const stateUpdate = await db
    .update(tournaments)
    .set({ status: "knockout", updatedAt: new Date() })
    .where(
      and(eq(tournaments.id, tournament.id), eq(tournaments.status, "group_play")),
    )
    .returning({ id: tournaments.id });
  if (stateUpdate.length === 0) {
    return { ok: false, error: "State changed under you, please refresh" };
  }

  const matchRows = bracket.slots.map((s) => ({
    tournamentId: tournament.id,
    phase: s.phase,
    bracketSlot: s.slot,
    playerAId: s.playerAId,
    playerBId: s.playerBId,
    status: "pending" as const,
  }));
  await db.insert(matches).values(matchRows);

  revalidatePath("/admin");
  revalidatePath("/groups");
  revalidatePath("/bracket");
  revalidatePath("/");
  return { ok: true };
}
