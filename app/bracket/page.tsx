import Link from "next/link";
import { PollingRefresh } from "@/components/PollingRefresh";
import { UpNextCard } from "@/components/UpNextCard";
import { getActiveTournamentOrThrow } from "@/lib/tournament/queries";
import {
  listBracketMatches,
  slotLabel,
  type BracketMatchView,
} from "@/lib/tournament/bracketView";
import { getUpNextMatch } from "@/lib/tournament/upNext";
import { getPathToVictory, type PathStep } from "@/lib/tournament/pathToVictory";

export const dynamic = "force-dynamic";

function Score({ view }: { view: BracketMatchView }) {
  const { match, playerA, playerB, results } = view;
  const a = results.find((r) => r.playerId === match.playerAId);
  const b = results.find((r) => r.playerId === match.playerBId);
  const isDone = match.status === "done";

  return (
    <div className="border border-fg-muted bg-bg-card p-3 w-full min-w-[200px]">
      <div className="flex items-center justify-between gap-2">
        <span className={a?.won ? "font-bold" : "text-fg-muted"}>
          {playerA?.name ?? "TBD"}
        </span>
        <span className="tabular-nums text-sm">
          {a ? a.points : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className={b?.won ? "font-bold" : "text-fg-muted"}>
          {playerB?.name ?? "TBD"}
        </span>
        <span className="tabular-nums text-sm">
          {b ? b.points : ""}
        </span>
      </div>
      {isDone && match.wentToSuddenDeath && (
        <div className="mt-2 text-xs uppercase tracking-wider border border-accent inline-block px-1.5 py-0.5 text-accent">
          Sudden Death
        </div>
      )}
    </div>
  );
}

function ChampionCard({
  championName,
  tournamentName,
  group,
  steps,
}: {
  championName: string;
  tournamentName: string;
  group: { name: string; position: number; wins: number; losses: number } | null;
  steps: PathStep[];
}) {
  return (
    <div className="border border-fg bg-bg-card p-8 md:p-12 max-w-2xl mx-auto text-center">
      <p className="text-sm uppercase tracking-wider text-fg-muted">
        {tournamentName}
      </p>
      <p className="mt-1 text-sm uppercase tracking-wider text-fg-muted">
        Champion
      </p>
      <h2 className="mt-6 text-5xl md:text-7xl font-extrabold break-words">
        {championName}
      </h2>

      {(group || steps.length > 0) && (
        <div className="mt-10 border-t border-fg-muted pt-6 text-left">
          <p className="text-xs uppercase tracking-wider text-fg-muted mb-3">
            Path to victory
          </p>
          <ul className="space-y-1 text-sm">
            {group && (
              <li>
                <span className="text-fg-muted">Group play:</span>{" "}
                {group.wins}–{group.losses} in {group.name}
              </li>
            )}
            {steps.map((s) => (
              <li key={s.label + s.opponent}>
                <span className="text-fg-muted">{s.label}:</span>{" "}
                d. {s.opponent}{" "}
                <span className="tabular-nums">
                  {s.championPoints}–{s.opponentPoints}
                </span>
                {s.suddenDeath && (
                  <span className="ml-2 text-xs uppercase tracking-wider text-accent">
                    (Sudden death)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default async function BracketPage() {
  const tournament = await getActiveTournamentOrThrow();
  const bracket = await listBracketMatches(tournament.id);
  const upNext = await getUpNextMatch(tournament.id);
  const path =
    tournament.status === "done"
      ? await getPathToVictory(tournament.id)
      : null;

  if (bracket.length === 0) {
    return (
      <main className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-4xl font-extrabold">Bracket</h1>
          <p className="mt-2 text-fg-muted">
            The bracket appears after group play ends.
          </p>
        </header>
        <Link href="/" className="text-sm text-fg-muted underline hover:text-fg">
          ← Home
        </Link>
      </main>
    );
  }

  const qfs = bracket.filter((b) => b.match.phase === "qf");
  const sfs = bracket.filter((b) => b.match.phase === "sf");
  const final = bracket.find((b) => b.match.phase === "final") ?? null;

  let championName: string | null = null;
  if (tournament.status === "done" && final) {
    const winnerResult = final.results.find((r) => r.won);
    if (winnerResult) {
      const winnerIsA = winnerResult.playerId === final.match.playerAId;
      championName = winnerIsA ? final.playerA?.name ?? null : final.playerB?.name ?? null;
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto">
      <PollingRefresh intervalMs={5000} />
      <UpNextCard upNext={upNext} />

      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold">Bracket</h1>
        <p className="mt-2 text-fg-muted">{tournament.name}</p>
      </header>

      {championName && (
        <section className="mb-10">
          <ChampionCard
            championName={championName}
            tournamentName={tournament.name}
            group={path?.group ?? null}
            steps={path?.steps ?? []}
          />
        </section>
      )}

      <section
        aria-live="polite"
        className="lg:hidden flex flex-col gap-4"
      >
        <h2 className="text-xs uppercase tracking-wider text-fg-muted">Quarterfinals</h2>
        {qfs.map((v) => (
          <div key={v.match.id}>
            <div className="text-xs text-fg-muted mb-1">
              {slotLabel(v.match.phase, v.match.bracketSlot)}
            </div>
            <Score view={v} />
          </div>
        ))}
        <h2 className="text-xs uppercase tracking-wider text-fg-muted mt-4">Semifinals</h2>
        {sfs.map((v) => (
          <div key={v.match.id}>
            <div className="text-xs text-fg-muted mb-1">
              {slotLabel(v.match.phase, v.match.bracketSlot)}
            </div>
            <Score view={v} />
          </div>
        ))}
        {final && (
          <>
            <h2 className="text-xs uppercase tracking-wider text-fg-muted mt-4">Final</h2>
            <Score view={final} />
          </>
        )}
      </section>

      <section
        aria-live="polite"
        className="hidden lg:grid grid-cols-3 gap-10"
      >
        <div className="flex flex-col justify-around gap-6">
          <div className="text-xs uppercase tracking-wider text-fg-muted">
            Quarterfinals
          </div>
          {qfs.map((v) => (
            <div key={v.match.id}>
              <div className="text-xs text-fg-muted mb-1">
                {slotLabel(v.match.phase, v.match.bracketSlot)}
              </div>
              <Score view={v} />
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-around gap-16">
          <div className="text-xs uppercase tracking-wider text-fg-muted">
            Semifinals
          </div>
          {sfs.map((v) => (
            <div key={v.match.id}>
              <div className="text-xs text-fg-muted mb-1">
                {slotLabel(v.match.phase, v.match.bracketSlot)}
              </div>
              <Score view={v} />
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-xs uppercase tracking-wider text-fg-muted mb-1">
            Final
          </div>
          {final && <Score view={final} />}
        </div>
      </section>

      <nav className="mt-10">
        <Link href="/" className="text-sm text-fg-muted underline hover:text-fg">
          ← Home
        </Link>
      </nav>
    </main>
  );
}
