"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchResults, matches, tournaments } from "@/lib/schema";
import { downstreamSlot } from "@/lib/tournament/bracket";
import { getActiveTournamentOrThrow } from "@/lib/tournament/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

type ScoreInput = {
  matchId: string;
  playerAPoints: number;
  playerBPoints: number;
  wentToSuddenDeath: boolean;
};

function parseScoreInput(formData: FormData): ScoreInput | string {
  const matchId = formData.get("matchId");
  const aRaw = formData.get("playerAPoints");
  const bRaw = formData.get("playerBPoints");
  const sd = formData.get("wentToSuddenDeath") === "on";

  if (typeof matchId !== "string" || matchId.length === 0) {
    return "Match id required";
  }

  const a = Number(aRaw);
  const b = Number(bRaw);
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    return "Scores must be whole numbers";
  }
  if (a < 0 || a > 200 || b < 0 || b > 200) {
    return "Scores must be between 0 and 200";
  }
  if (a === b) {
    return "Scores must differ (sudden death resolves ties)";
  }

  return { matchId, playerAPoints: a, playerBPoints: b, wentToSuddenDeath: sd };
}

async function updateDownstreamSlot(
  tournamentId: string,
  currentSlot: number,
  winnerId: string,
) {
  const target = downstreamSlot(currentSlot);
  if (!target) return;

  const [downstream] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournamentId),
        eq(matches.bracketSlot, target.slot),
      ),
    )
    .limit(1);

  if (!downstream) return;

  const patch =
    target.side === "a" ? { playerAId: winnerId } : { playerBId: winnerId };

  await db.update(matches).set(patch).where(eq(matches.id, downstream.id));
}

export async function postKnockoutResult(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseScoreInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const tournament = await getActiveTournamentOrThrow();
  if (tournament.status !== "knockout") {
    return { ok: false, error: "Knockout is not active" };
  }

  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(eq(matches.id, parsed.matchId), eq(matches.tournamentId, tournament.id)),
    )
    .limit(1);

  if (!match) return { ok: false, error: "Match not found" };
  if (match.phase === "group") {
    return { ok: false, error: "Use the group results form for group matches" };
  }
  if (match.status === "done") {
    return { ok: false, error: "Match already posted; use Edit" };
  }
  if (!match.playerAId || !match.playerBId) {
    return { ok: false, error: "Match is missing a player; post the upstream match first" };
  }

  const aWins = parsed.playerAPoints > parsed.playerBPoints;
  const winnerId = aWins ? match.playerAId : match.playerBId;

  await db.insert(matchResults).values([
    {
      matchId: match.id,
      playerId: match.playerAId,
      points: parsed.playerAPoints,
      won: aWins,
    },
    {
      matchId: match.id,
      playerId: match.playerBId,
      points: parsed.playerBPoints,
      won: !aWins,
    },
  ]);

  await db
    .update(matches)
    .set({
      status: "done",
      wentToSuddenDeath: parsed.wentToSuddenDeath,
      playedAt: new Date(),
    })
    .where(eq(matches.id, match.id));

  if (match.bracketSlot != null) {
    await updateDownstreamSlot(tournament.id, match.bracketSlot, winnerId);
  }

  if (match.phase === "final") {
    await db
      .update(tournaments)
      .set({ status: "done", updatedAt: new Date() })
      .where(
        and(eq(tournaments.id, tournament.id), eq(tournaments.status, "knockout")),
      );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/knockout");
  revalidatePath("/bracket");
  revalidatePath("/");
  return { ok: true };
}

export async function editKnockoutResult(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseScoreInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const tournament = await getActiveTournamentOrThrow();
  if (tournament.status !== "knockout") {
    return { ok: false, error: "Edits are only allowed during the knockout" };
  }

  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(eq(matches.id, parsed.matchId), eq(matches.tournamentId, tournament.id)),
    )
    .limit(1);

  if (!match) return { ok: false, error: "Match not found" };
  if (match.phase === "group") {
    return { ok: false, error: "Use the group results form for group matches" };
  }
  if (match.status !== "done") {
    return { ok: false, error: "Can't edit a pending match; post it first" };
  }
  if (!match.playerAId || !match.playerBId) {
    return { ok: false, error: "Match is missing players" };
  }

  if (match.bracketSlot != null) {
    const target = downstreamSlot(match.bracketSlot);
    if (target) {
      const [downstream] = await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.tournamentId, tournament.id),
            eq(matches.bracketSlot, target.slot),
          ),
        )
        .limit(1);
      if (downstream && downstream.status === "done") {
        return {
          ok: false,
          error: "Can't edit — the next round has already been played",
        };
      }
    }
  }

  const aWins = parsed.playerAPoints > parsed.playerBPoints;
  const winnerId = aWins ? match.playerAId : match.playerBId;

  await db.delete(matchResults).where(eq(matchResults.matchId, match.id));
  await db.insert(matchResults).values([
    {
      matchId: match.id,
      playerId: match.playerAId,
      points: parsed.playerAPoints,
      won: aWins,
    },
    {
      matchId: match.id,
      playerId: match.playerBId,
      points: parsed.playerBPoints,
      won: !aWins,
    },
  ]);

  await db
    .update(matches)
    .set({
      wentToSuddenDeath: parsed.wentToSuddenDeath,
      playedAt: new Date(),
    })
    .where(eq(matches.id, match.id));

  if (match.bracketSlot != null) {
    await updateDownstreamSlot(tournament.id, match.bracketSlot, winnerId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/knockout");
  revalidatePath("/bracket");
  return { ok: true };
}
