"use client";

import { useState } from "react";
import type { Match, MatchResult, Player } from "@/lib/schema";
import { KnockoutScoreForm } from "./ScoreForm";

type Props = {
  match: Match;
  playerA: Player | null;
  playerB: Player | null;
  results: MatchResult[];
  label: string;
};

export function KnockoutMatchRow({
  match,
  playerA,
  playerB,
  results,
  label,
}: Props) {
  const [editing, setEditing] = useState(false);

  const aResult = results.find((r) => r.playerId === match.playerAId);
  const bResult = results.find((r) => r.playerId === match.playerBId);
  const isDone = match.status === "done";
  const bothPlayersSet = !!playerA && !!playerB;

  if (!bothPlayersSet && !isDone) {
    return (
      <div className="border border-fg-muted p-3">
        <div className="text-xs uppercase tracking-wider text-fg-muted mb-2">
          {label}
        </div>
        <div className="text-sm text-fg-muted">
          {playerA?.name ?? "TBD"} <span className="text-fg">vs</span>{" "}
          {playerB?.name ?? "TBD"}
        </div>
        <p className="mt-2 text-xs text-fg-muted">
          Post the upstream result first.
        </p>
      </div>
    );
  }

  if ((!isDone || editing) && playerA && playerB) {
    return (
      <div className="border border-fg-muted p-3">
        <div className="text-xs uppercase tracking-wider text-fg-muted mb-2">
          {label}
        </div>
        <div className="text-sm text-fg-muted mb-2">
          {playerA.name} <span className="text-fg">vs</span> {playerB.name}
        </div>
        <KnockoutScoreForm
          matchId={match.id}
          playerAName={playerA.name}
          playerBName={playerB.name}
          mode={isDone ? "edit" : "post"}
          initialPlayerAPoints={aResult?.points}
          initialPlayerBPoints={bResult?.points}
          initialWentToSuddenDeath={match.wentToSuddenDeath}
          onDone={editing ? () => setEditing(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="border border-fg-muted p-3 flex items-center justify-between gap-3">
      <div className="flex-1 text-sm">
        <div className="text-xs uppercase tracking-wider text-fg-muted">
          {label}
        </div>
        <span className={aResult?.won ? "font-bold" : "text-fg-muted"}>
          {playerA?.name ?? "TBD"}
        </span>
        <span className="mx-2 text-fg-muted">vs</span>
        <span className={bResult?.won ? "font-bold" : "text-fg-muted"}>
          {playerB?.name ?? "TBD"}
        </span>
        {aResult && bResult && (
          <span className="ml-3 tabular-nums">
            {aResult.points}–{bResult.points}
          </span>
        )}
        {match.wentToSuddenDeath && (
          <span className="ml-3 text-xs uppercase tracking-wider border border-accent px-1.5 py-0.5 text-accent">
            Sudden Death
          </span>
        )}
      </div>
      {isDone && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-fg-muted underline hover:text-fg"
        >
          Edit
        </button>
      )}
    </div>
  );
}
