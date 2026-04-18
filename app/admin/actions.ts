"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groupAssignments,
  groups,
  matches,
  players,
  tournaments,
} from "@/lib/schema";
import { drawGroups as computeDraw } from "@/lib/tournament/draw";
import { getActiveTournamentOrThrow } from "@/lib/tournament/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function lockRegistration(): Promise<ActionResult> {
  const tournament = await getActiveTournamentOrThrow();

  const active = await db
    .select({ id: players.id })
    .from(players)
    .where(
      and(eq(players.tournamentId, tournament.id), isNull(players.withdrawnAt)),
    );

  const expected =
    tournament.config.group_count * tournament.config.group_size;
  if (active.length !== expected) {
    return {
      ok: false,
      error: `Need exactly ${expected} active players to lock (have ${active.length})`,
    };
  }

  const updated = await db
    .update(tournaments)
    .set({ status: "locked", updatedAt: new Date() })
    .where(and(eq(tournaments.id, tournament.id), eq(tournaments.status, "draft")))
    .returning({ id: tournaments.id });

  if (updated.length === 0) {
    return { ok: false, error: "State changed under you, please refresh" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/players");
  revalidatePath("/");
  return { ok: true };
}

export async function drawGroups(): Promise<ActionResult> {
  const tournament = await getActiveTournamentOrThrow();

  const activePlayers = await db
    .select({ id: players.id })
    .from(players)
    .where(
      and(eq(players.tournamentId, tournament.id), isNull(players.withdrawnAt)),
    )
    .orderBy(asc(players.registeredAt));

  const playerIds = activePlayers.map((p) => p.id);

  let drawn;
  try {
    drawn = computeDraw({
      tournamentId: tournament.id,
      playerIds,
      groupCount: tournament.config.group_count,
      groupSize: tournament.config.group_size,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Draw failed",
    };
  }

  const stateUpdate = await db
    .update(tournaments)
    .set({ status: "group_play", updatedAt: new Date() })
    .where(and(eq(tournaments.id, tournament.id), eq(tournaments.status, "locked")))
    .returning({ id: tournaments.id });

  if (stateUpdate.length === 0) {
    return { ok: false, error: "State changed under you, please refresh" };
  }

  const groupRows = drawn.groups.map((g) => ({
    tournamentId: tournament.id,
    name: g.name,
    position: g.position,
  }));
  const insertedGroups = await db.insert(groups).values(groupRows).returning();

  const positionToId = new Map(insertedGroups.map((g) => [g.position, g.id]));

  const assignmentRows = drawn.groups.flatMap((g) =>
    g.playerIds.map((playerId) => ({
      groupId: positionToId.get(g.position)!,
      playerId,
    })),
  );
  await db.insert(groupAssignments).values(assignmentRows);

  const matchRows = drawn.matches.map((m) => ({
    tournamentId: tournament.id,
    phase: "group" as const,
    groupId: positionToId.get(m.groupPosition)!,
    playerAId: m.playerAId,
    playerBId: m.playerBId,
    status: "pending" as const,
  }));
  await db.insert(matches).values(matchRows);

  revalidatePath("/admin");
  revalidatePath("/groups");
  revalidatePath("/");
  return { ok: true };
}
