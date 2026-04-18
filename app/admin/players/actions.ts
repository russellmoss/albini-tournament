"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, tournaments } from "@/lib/schema";
import { getActiveTournamentOrThrow } from "@/lib/tournament/queries";
import { validatePlayerName } from "@/lib/tournament/validation";
import { forfeitPendingMatchesForPlayer } from "@/app/admin/groups/actions";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerPlayer(formData: FormData): Promise<ActionResult> {
  const raw = formData.get("name");
  const validation = validatePlayerName(raw);
  if (!validation.ok) return { ok: false, error: validation.error };

  const tournament = await getActiveTournamentOrThrow();
  if (tournament.status !== "draft") {
    return { ok: false, error: "Registration is locked" };
  }

  try {
    await db.insert(players).values({
      tournamentId: tournament.id,
      name: validation.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("players_tournament_name_idx") || message.includes("duplicate")) {
      return { ok: false, error: `"${validation.name}" is already registered` };
    }
    throw err;
  }

  revalidatePath("/admin/players");
  revalidatePath("/");
  return { ok: true };
}

export async function withdrawPlayer(formData: FormData): Promise<ActionResult> {
  const id = formData.get("playerId");
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Player id required" };
  }

  const tournament = await getActiveTournamentOrThrow();

  const updated = await db
    .update(players)
    .set({ withdrawnAt: new Date() })
    .where(
      and(
        eq(players.id, id),
        eq(players.tournamentId, tournament.id),
        isNull(players.withdrawnAt),
      ),
    )
    .returning({ id: players.id });

  if (updated.length === 0) {
    return { ok: false, error: "Player not found or already withdrawn" };
  }

  if (tournament.status === "group_play") {
    await forfeitPendingMatchesForPlayer({
      tournamentId: tournament.id,
      playerId: id,
    });
  }

  revalidatePath("/admin/players");
  revalidatePath("/admin/groups");
  revalidatePath("/groups");
  revalidatePath("/");
  return { ok: true };
}

export async function deletePlayer(formData: FormData): Promise<ActionResult> {
  const id = formData.get("playerId");
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Player id required" };
  }

  const tournament = await getActiveTournamentOrThrow();

  const [current] = await db
    .select({ status: tournaments.status })
    .from(tournaments)
    .where(eq(tournaments.id, tournament.id))
    .limit(1);

  if (!current || current.status !== "draft") {
    return { ok: false, error: "Cannot delete once registration is locked" };
  }

  const deleted = await db
    .delete(players)
    .where(and(eq(players.id, id), eq(players.tournamentId, tournament.id)))
    .returning({ id: players.id });

  if (deleted.length === 0) {
    return { ok: false, error: "Player not found" };
  }

  revalidatePath("/admin/players");
  revalidatePath("/");
  return { ok: true };
}
