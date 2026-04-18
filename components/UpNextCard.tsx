import type { UpNextMatch } from "@/lib/tournament/upNext";

export function UpNextCard({ upNext }: { upNext: UpNextMatch | null }) {
  if (!upNext) return null;
  return (
    <section
      aria-live="polite"
      className="sticky top-0 z-20 mb-6 border-2 border-accent bg-bg-card p-4"
    >
      <p className="text-xs uppercase tracking-wider text-fg-muted">Up next</p>
      <p className="mt-1 font-semibold">
        {upNext.playerA.name}
        <span className="mx-2 text-fg-muted font-normal">vs</span>
        {upNext.playerB.name}
      </p>
      <p className="mt-0.5 text-xs text-fg-muted">{upNext.label}</p>
    </section>
  );
}
