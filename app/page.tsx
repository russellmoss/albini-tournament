import Link from "next/link";
import { PollingRefresh } from "@/components/PollingRefresh";
import { UpNextCard } from "@/components/UpNextCard";
import { getActiveTournament, listPlayers } from "@/lib/tournament/queries";
import { getUpNextMatch } from "@/lib/tournament/upNext";

export const dynamic = "force-dynamic";

function EmptyState({ message }: { message: string }) {
  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="border border-fg bg-bg-card p-8">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Albini Tournament
        </h1>
        <p className="mt-4 text-fg-muted">{message}</p>
        <nav className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/admin" className="text-fg-muted underline hover:text-fg">
            Admin
          </Link>
        </nav>
      </div>
    </main>
  );
}

function statusLine(status: string, count: number, target: number): string {
  switch (status) {
    case "draft":
      return `Registration open · ${count} of ${target}`;
    case "locked":
      return `Registration locked · ${count} players`;
    case "group_play":
      return "Group play in progress";
    case "knockout":
      return "Knockout: round of 8";
    case "done":
      return "Champion crowned";
    default:
      return status;
  }
}

export default async function Home() {
  let tournament;
  let roster;
  let upNext;
  try {
    tournament = await getActiveTournament();
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("DATABASE_URL")
        ? "Database is not configured yet. Set DATABASE_URL in Vercel project settings."
        : "Could not reach the database. Check DATABASE_URL and network access.";
    return <EmptyState message={message} />;
  }
  if (!tournament) {
    return (
      <EmptyState message="No tournament yet. Run `npm run db:seed` to create one." />
    );
  }
  try {
    roster = await listPlayers(tournament.id);
    upNext = await getUpNextMatch(tournament.id);
  } catch {
    return <EmptyState message="Tournament found but data could not be loaded." />;
  }
  const active = roster.filter((p) => p.withdrawnAt === null);

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <PollingRefresh intervalMs={5000} />
      <UpNextCard upNext={upNext} />

      <div className="border border-fg bg-bg-card p-8">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          {tournament.name}
        </h1>
        <p className="mt-4 text-fg-muted">
          {statusLine(
            tournament.status,
            active.length,
            tournament.config.group_count * tournament.config.group_size,
          )}
        </p>

        {active.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm text-fg-muted uppercase tracking-wider mb-3">
              Players
            </h2>
            <ul
              aria-live="polite"
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1"
            >
              {active.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </section>
        )}

        <nav className="mt-10 flex flex-wrap gap-4 text-sm">
          {(tournament.status === "group_play" ||
            tournament.status === "knockout" ||
            tournament.status === "done") && (
            <Link
              href="/groups"
              className="text-fg-muted underline hover:text-fg"
            >
              Groups
            </Link>
          )}
          {(tournament.status === "knockout" || tournament.status === "done") && (
            <Link
              href="/bracket"
              className="text-fg-muted underline hover:text-fg"
            >
              Bracket
            </Link>
          )}
          <Link href="/admin" className="text-fg-muted underline hover:text-fg">
            Admin
          </Link>
        </nav>
      </div>
    </main>
  );
}
