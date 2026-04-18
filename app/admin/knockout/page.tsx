import Link from "next/link";
import { getActiveTournamentOrThrow } from "@/lib/tournament/queries";
import {
  listBracketMatches,
  slotLabel,
} from "@/lib/tournament/bracketView";
import { KnockoutMatchRow } from "./MatchRow";

export const dynamic = "force-dynamic";

export default async function AdminKnockoutPage() {
  const tournament = await getActiveTournamentOrThrow();
  const bracketMatches = await listBracketMatches(tournament.id);

  if (bracketMatches.length === 0) {
    return (
      <main className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
        <nav className="mb-6 text-sm">
          <Link href="/admin" className="text-fg-muted underline hover:text-fg">
            ← Admin
          </Link>
        </nav>
        <header className="mb-8">
          <h1 className="text-2xl md:text-4xl font-extrabold">Knockout</h1>
          <p className="mt-2 text-fg-muted">
            Start the knockout from the admin dashboard.
          </p>
        </header>
      </main>
    );
  }

  const qfs = bracketMatches.filter((b) => b.match.phase === "qf");
  const sfs = bracketMatches.filter((b) => b.match.phase === "sf");
  const final = bracketMatches.find((b) => b.match.phase === "final");

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto">
      <nav className="mb-6 text-sm">
        <Link href="/admin" className="text-fg-muted underline hover:text-fg">
          ← Admin
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold">Knockout</h1>
        <p className="mt-2 text-fg-muted">
          Status {tournament.status}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-wider text-fg-muted mb-3">
          Quarterfinals
        </h2>
        <div className="grid gap-3">
          {qfs.map(({ match, playerA, playerB, results }) => (
            <KnockoutMatchRow
              key={match.id}
              match={match}
              playerA={playerA}
              playerB={playerB}
              results={results}
              label={slotLabel(match.phase, match.bracketSlot)}
            />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-wider text-fg-muted mb-3">
          Semifinals
        </h2>
        <div className="grid gap-3">
          {sfs.map(({ match, playerA, playerB, results }) => (
            <KnockoutMatchRow
              key={match.id}
              match={match}
              playerA={playerA}
              playerB={playerB}
              results={results}
              label={slotLabel(match.phase, match.bracketSlot)}
            />
          ))}
        </div>
      </section>

      {final && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-fg-muted mb-3">
            Final
          </h2>
          <KnockoutMatchRow
            match={final.match}
            playerA={final.playerA}
            playerB={final.playerB}
            results={final.results}
            label="Final"
          />
        </section>
      )}
    </main>
  );
}
