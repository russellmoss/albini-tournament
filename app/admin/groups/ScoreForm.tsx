"use client";

import { useRef, useState, useTransition } from "react";
import { editGroupResult, postGroupResult } from "./actions";

type Props = {
  matchId: string;
  playerAName: string;
  playerBName: string;
  mode: "post" | "edit";
  initialPlayerAPoints?: number;
  initialPlayerBPoints?: number;
  initialWentToSuddenDeath?: boolean;
  onDone?: () => void;
};

export function ScoreForm({
  matchId,
  playerAName,
  playerBName,
  mode,
  initialPlayerAPoints,
  initialPlayerBPoints,
  initialWentToSuddenDeath,
  onDone,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            const action = mode === "edit" ? editGroupResult : postGroupResult;
            const result = await action(formData);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            formRef.current?.reset();
            onDone?.();
          } catch {
            setError("Network error. Please retry.");
          }
        });
      }}
      className="grid gap-3"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">{playerAName}</span>
          <input
            name="playerAPoints"
            type="number"
            min={0}
            max={200}
            step={1}
            required
            defaultValue={initialPlayerAPoints}
            inputMode="numeric"
            className="bg-bg-card border border-fg-muted px-3 py-2 text-fg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">{playerBName}</span>
          <input
            name="playerBPoints"
            type="number"
            min={0}
            max={200}
            step={1}
            required
            defaultValue={initialPlayerBPoints}
            inputMode="numeric"
            className="bg-bg-card border border-fg-muted px-3 py-2 text-fg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="wentToSuddenDeath"
          defaultChecked={initialWentToSuddenDeath}
          className="h-4 w-4 accent-accent"
        />
        <span>Sudden death</span>
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="border border-fg px-4 py-2 hover:bg-fg hover:text-bg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
        >
          {isPending ? "Saving…" : mode === "edit" ? "Save edit" : "Post result"}
        </button>
        {mode === "edit" && onDone && (
          <button
            type="button"
            disabled={isPending}
            onClick={onDone}
            className="border border-fg-muted px-4 py-2"
          >
            Cancel
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
