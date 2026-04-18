"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { verifyPin } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
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
            const result = await verifyPin(formData);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(result.redirectTo);
            router.refresh();
          } catch {
            setError("Network error. Please retry.");
          }
        });
      }}
      className="grid gap-4"
    >
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-2">
        <span className="text-sm text-fg-muted">Admin PIN</span>
        <input
          type="password"
          name="pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          className="bg-bg-card border border-fg-muted px-4 py-3 text-fg text-xl tracking-widest focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="border border-fg px-4 py-3 hover:bg-fg hover:text-bg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
      >
        {isPending ? "Checking…" : "Sign in"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
