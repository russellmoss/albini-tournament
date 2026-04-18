"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchResults, matches } from "@/lib/schema";
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

export async function postGroupResult(formData: FormData): Promise<ActionResult> {
  const parsed = parseScoreInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const tournament = await getActiveTournamentOrThrow();
  if (tournament.status !== "group_play") {
    return { ok: false, error: "Group play is not active" };
  }

  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.id, parsed.matchId),
        eq(matches.tournamentId, tournament.id),
        eq(matches.phase, "group"),
      ),
    )
    .limit(1);

  if (!match) return { ok: false, error: "Match not found" };
  if (match.status === "done") {
    return { ok: false, error: "Match already posted; use Edit" };
  }
  if (!match.playerAId || !match.playerBId) {
    return { ok: false, error: "Match is missing players" };
  }

  const aWins = parsed.playerAPoints > parsed.playerBPoints;

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

  revalidatePath("/admin/groups");
  revalidatePath("/groups");
  revalidatePath("/");
  return { ok: true };
}

export async function editGroupResult(formData: FormData): Promise<ActionResult> {
  const parsed = parseScoreInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const tournament = await getActiveTournamentOrThrow();
  if (tournament.status !== "group_play") {
    return { ok: false, error: "Edits are only allowed during group play" };
  }

  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.id, parsed.matchId),
        eq(matches.tournamentId, tournament.id),
        eq(matches.phase, "group"),
      ),
    )
    .limit(1);

  if (!match) return { ok: false, error: "Match not found" };
  if (match.status !== "done") {
    return { ok: false, error: "Can't edit a pending match; post it first" };
  }
  if (!match.playerAId || !match.playerBId) {
    return { ok: false, error: "Match is missing players" };
  }

  const aWins = parsed.playerAPoints > parsed.playerBPoints;

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

  revalidatePath("/admin/groups");
  revalidatePath("/groups");
  return { ok: true };
}

export async function forfeitPendingMatchesForPlayer(params: {
  tournamentId: string;
  playerId: string;
}): Promise<void> {
  const pending = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, params.tournamentId),
        eq(matches.phase, "group"),
        eq(matches.status, "pending"),
      ),
    );

  const toForfeit = pending.filter(
    (m) => m.playerAId === params.playerId || m.playerBId === params.playerId,
  );
  if (toForfeit.length === 0) return;

  const now = new Date();

  const resultRows = toForfeit.flatMap((m) => {
    if (!m.playerAId || !m.playerBId) return [];
    const withdrawnIsA = m.playerAId === params.playerId;
    return [
      {
        matchId: m.id,
        playerId: m.playerAId,
        points: 0,
        won: !withdrawnIsA,
        forfeit: withdrawnIsA,
      },
      {
        matchId: m.id,
        playerId: m.playerBId,
        points: 0,
        won: withdrawnIsA,
        forfeit: !withdrawnIsA,
      },
    ];
  });

  if (resultRows.length > 0) {
    await db.insert(matchResults).values(resultRows);
    await db
      .update(matches)
      .set({ status: "done", playedAt: now })
      .where(
        inArray(
          matches.id,
          toForfeit.map((m) => m.id),
        ),
      );
  }
}
