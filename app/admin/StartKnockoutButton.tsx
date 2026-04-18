"use client";

import { useState, useTransition } from "react";
import { startKnockout } from "./knockout/actions";

export function StartKnockoutButton({ disabled }: { disabled?: boolean }) {
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
              const result = await startKnockout();
              if (!result.ok) setError(result.error);
            } catch {
              setError("Network error. Please retry.");
            }
          });
        }}
        className="border border-fg px-4 py-3 text-left hover:bg-fg hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
      >
        {isPending ? "Seeding…" : "Start Knockout →"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </>
  );
}
