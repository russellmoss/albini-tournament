"use client";

import { useState, useTransition } from "react";
import { drawGroups, lockRegistration } from "./actions";

export function LockButton({ disabled }: { disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setConfirming(true)}
        className="border border-fg px-4 py-3 text-left hover:bg-fg hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
      >
        Lock Registration →
      </button>
    );
  }

  return (
    <div className="border border-accent p-4">
      <p className="mb-3">
        Lock registration? <span className="text-fg-muted">No more late arrivals.</span>
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const result = await lockRegistration();
                if (!result.ok) {
                  setError(result.error);
                  setConfirming(false);
                }
              } catch {
                setError("Network error. Please retry.");
                setConfirming(false);
              }
            });
          }}
          className="border border-accent bg-accent text-fg px-4 py-2 disabled:opacity-50"
        >
          {isPending ? "Locking…" : "Yes, lock it"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="border border-fg-muted px-4 py-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function DrawButton({ disabled }: { disabled?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await drawGroups();
              if (!result.ok) setError(result.error);
            } catch {
              setError("Network error. Please retry.");
            }
          });
        }}
        className="border border-fg px-4 py-3 text-left hover:bg-fg hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
      >
        {isPending ? "Drawing…" : "Draw Groups →"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </>
  );
}
