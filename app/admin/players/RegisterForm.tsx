"use client";

import { useRef, useState, useTransition } from "react";
import { registerPlayer } from "./actions";

export function RegisterForm({ disabled }: { disabled?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            const result = await registerPlayer(formData);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            formRef.current?.reset();
            inputRef.current?.focus();
          } catch {
            setError("Network error. Please retry.");
          }
        });
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor="player-name" className="text-sm text-fg-muted">
        Player name
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id="player-name"
          name="name"
          type="text"
          required
          autoComplete="off"
          disabled={disabled || isPending}
          maxLength={40}
          className="flex-1 bg-bg-card border border-fg-muted px-3 py-2 text-fg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
        />
        <button
          type="submit"
          disabled={disabled || isPending}
          className="border border-fg px-4 py-2 text-fg hover:bg-fg hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
