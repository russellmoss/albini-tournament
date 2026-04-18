import Link from "next/link";
import { getActiveTournamentOrThrow } from "@/lib/tournament/queries";
import { listGroupMatches } from "@/lib/tournament/matchView";
import { MatchRow } from "./MatchRow";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const tournament = await getActiveTournamentOrThrow();
  const groupsWithMatches = await listGroupMatches(tournament.id);

  if (groupsWithMatches.length === 0) {
    return (
      <main className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-4xl font-extrabold">Group matches</h1>
          <p className="mt-2 text-fg-muted">Draw groups first.</p>
        </header>
        <Link href="/admin" className="text-sm text-fg-muted underline hover:text-fg">
          ← Admin
        </Link>
      </main>
    );
  }

  const allMatches = groupsWithMatches.flatMap((g) => g.matches);
  const pendingCount = allMatches.filter((m) => m.match.status === "pending").length;
  const doneCount = allMatches.length - pendingCount;

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto">
      <nav className="mb-6 text-sm">
        <Link href="/admin" className="text-fg-muted underline hover:text-fg">
          ← Admin
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold">Group matches</h1>
        <p className="mt-2 text-fg-muted">
          {pendingCount} pending · {doneCount} posted
        </p>
      </header>

      <div className="grid gap-10">
        {groupsWithMatches.map(({ group, matches }) => {
          const pending = matches.filter((m) => m.match.status === "pending");
          const done = matches.filter((m) => m.match.status === "done");
          return (
            <section key={group.id}>
              <h2 className="text-xs uppercase tracking-wider text-fg-muted">
                Group {group.position}
              </h2>
              <p className="text-lg font-semibold mb-4">{group.name}</p>
              {pending.length > 0 && (
                <>
                  <h3 className="text-sm mb-2">Pending</h3>
                  <div className="grid gap-3 mb-6">
                    {pending.map(({ match, playerA, playerB, results }) => (
                      <MatchRow
                        key={match.id}
                        match={match}
                        playerA={playerA}
                        playerB={playerB}
                        results={results}
                      />
                    ))}
                  </div>
                </>
              )}
              {done.length > 0 && (
                <>
                  <h3 className="text-sm mb-2">Posted</h3>
                  <div className="grid gap-3">
                    {done.map(({ match, playerA, playerB, results }) => (
                      <MatchRow
                        key={match.id}
                        match={match}
                        playerA={playerA}
                        playerB={playerB}
                        results={results}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
