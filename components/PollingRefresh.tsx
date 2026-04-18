"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  intervalMs?: number;
};

export function PollingRefresh({ intervalMs = 5000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      router.refresh();
    };
    const timer = window.setInterval(tick, intervalMs);
    const onVisibility = () => {
      if (!document.hidden) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
