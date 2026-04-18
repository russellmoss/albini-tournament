"use client";

import { useTransition } from "react";
import { logout } from "./login/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await logout();
        });
      }}
      className="text-sm text-fg-muted underline hover:text-fg disabled:opacity-50"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
