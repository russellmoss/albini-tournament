"use client";

import { useState, useTransition } from "react";
import { deletePlayer, withdrawPlayer } from "./actions";

export function WithdrawButton({ playerId }: { playerId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await withdrawPlayer(formData);
              if (!result.ok) setError(result.error);
            } catch {
              setError("Network error. Please retry.");
            }
          });
        }}
      >
        <input type="hidden" name="playerId" value={playerId} />
        <button
          type="submit"
          disabled={isPending}
          className="text-sm text-fg-muted underline hover:text-fg disabled:opacity-50"
        >
          {isPending ? "Withdrawing…" : "Withdraw"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-xs text-red-400 mt-1">
          {error}
        </p>
      )}
    </>
  );
}

export function DeleteButton({ playerId }: { playerId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await deletePlayer(formData);
              if (!result.ok) setError(result.error);
            } catch {
              setError("Network error. Please retry.");
            }
          });
        }}
      >
        <input type="hidden" name="playerId" value={playerId} />
        <button
          type="submit"
          disabled={isPending}
          className="text-sm text-fg-muted underline hover:text-fg disabled:opacity-50"
        >
          {isPending ? "Removing…" : "Remove"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-xs text-red-400 mt-1">
          {error}
        </p>
      )}
    </>
  );
}
