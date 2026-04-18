import Link from "next/link";
import { PollingRefresh } from "@/components/PollingRefresh";
import { UpNextCard } from "@/components/UpNextCard";
import { getActiveTournamentOrThrow } from "@/lib/tournament/queries";
import { listGroupMatches } from "@/lib/tournament/matchView";
import {
  rankGroup,
  type HeadToHeadMatch,
  type StandingRow,
} from "@/lib/tournament/standings";
import { getUpNextMatch } from "@/lib/tournament/upNext";

export const dynamic = "force-dynamic";

function tiebreakLabel(t: StandingRow["tiebreak"]): string | null {
  if (t === "h2h") return "head-to-head";
  if (t === "sub-table") return "sub-table";
  if (t === "coin-flip") return "coin flip";
  return null;
}

export default async function GroupsPage() {
  const tournament = await getActiveTournamentOrThrow();
  const groupsWithMatches = await listGroupMatches(tournament.id);
  const upNext = await getUpNextMatch(tournament.id);

  if (groupsWithMatches.length === 0) {
    return (
      <main className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-4xl font-extrabold">Groups</h1>
          <p className="mt-2 text-fg-muted">
            Groups will appear here after the draw.
          </p>
        </header>
        <Link href="/" className="text-sm text-fg-muted underline hover:text-fg">
          ← Home
        </Link>
      </main>
    );
  }

  const advanceTop = tournament.config.advance_top;

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto">
      <PollingRefresh intervalMs={5000} />
      <UpNextCard upNext={upNext} />

      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold">Groups</h1>
        <p className="mt-2 text-fg-muted">{tournament.name}</p>
      </header>

      <section
        aria-live="polite"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {groupsWithMatches.map(({ group, players, matches }) => {
          const playerIds = players.map((p) => p.id);
          const completed: HeadToHeadMatch[] = matches
            .filter((m) => m.match.status === "done")
            .flatMap(({ match, results }) => {
              const a = results.find((r) => r.playerId === match.playerAId);
              const b = results.find((r) => r.playerId === match.playerBId);
              if (!a || !b || !match.playerAId || !match.playerBId) return [];
              return [
                {
                  playerAId: match.playerAId,
                  playerBId: match.playerBId,
                  playerAPoints: a.points,
                  playerBPoints: b.points,
                },
              ];
            });

          const ranked = rankGroup({
            playerIds,
            matches: completed,
            seedInputs: [tournament.id, ...playerIds],
          });
          const totalMatches = matches.length;
          const doneMatches = matches.filter(
            (m) => m.match.status === "done",
          ).length;

          return (
            <article key={group.id} className="border border-fg-muted p-4">
              <h2 className="text-xs uppercase tracking-wider text-fg-muted mb-1">
                Group {group.position}
              </h2>
              <p className="text-lg font-semibold">{group.name}</p>
              <p className="text-xs text-fg-muted mb-4">
                {doneMatches} of {totalMatches} matches played
              </p>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-fg-muted">
                    <th className="pb-2">Player</th>
                    <th className="pb-2 text-right tabular-nums">W</th>
                    <th className="pb-2 text-right tabular-nums">Pts</th>
                    <th className="pb-2 text-right tabular-nums">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((row) => {
                    const player = players.find(
                      (p) => p.id === row.playerId,
                    );
                    const advances = row.rank <= advanceTop;
                    const note = tiebreakLabel(row.tiebreak);
                    return (
                      <tr key={row.playerId} className="border-t border-fg-muted/30">
                        <td className="py-2">
                          <span
                            className={
                              advances
                                ? "border-l-2 border-accent pl-2 font-bold"
                                : "pl-2"
                            }
                          >
                            {player?.name ?? row.playerId}
                          </span>
                          {advances && (
                            <span className="ml-2 text-xs text-fg-muted uppercase tracking-wider">
                              Advances
                            </span>
                          )}
                          {note && (
                            <span className="ml-2 text-xs text-fg-muted">
                              ({note})
                            </span>
                          )}
                          {player?.withdrawnAt && (
                            <span className="ml-2 text-xs text-fg-muted uppercase tracking-wider">
                              Out
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right tabular-nums">{row.wins}</td>
                        <td className="py-2 text-right tabular-nums">
                          {row.pointsScored}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {row.pointDiff >= 0 ? "+" : ""}
                          {row.pointDiff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </article>
          );
        })}
      </section>

      <nav className="mt-8">
        <Link href="/" className="text-sm text-fg-muted underline hover:text-fg">
          ← Home
        </Link>
      </nav>
    </main>
  );
}
