"use client";

import { useState } from "react";
import type { Match, MatchResult, Player } from "@/lib/schema";
import { ScoreForm } from "./ScoreForm";

type Props = {
  match: Match;
  playerA: Player;
  playerB: Player;
  results: MatchResult[];
};

export function MatchRow({ match, playerA, playerB, results }: Props) {
  const [editing, setEditing] = useState(false);

  const aResult = results.find((r) => r.playerId === match.playerAId);
  const bResult = results.find((r) => r.playerId === match.playerBId);
  const isDone = match.status === "done";

  if (!isDone || editing) {
    return (
      <div className="border border-fg-muted p-3">
        <div className="text-sm text-fg-muted mb-2">
          {playerA.name} <span className="text-fg">vs</span> {playerB.name}
        </div>
        <ScoreForm
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
        <span className={aResult?.won ? "font-bold" : "text-fg-muted"}>
          {playerA.name}
        </span>
        <span className="mx-2 text-fg-muted">vs</span>
        <span className={bResult?.won ? "font-bold" : "text-fg-muted"}>
          {playerB.name}
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
        {(aResult?.forfeit || bResult?.forfeit) && (
          <span className="ml-3 text-xs uppercase tracking-wider text-fg-muted">
            Forfeit
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm text-fg-muted underline hover:text-fg"
      >
        Edit
      </button>
    </div>
  );
}
