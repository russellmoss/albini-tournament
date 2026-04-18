import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/schema";
import { getActiveTournamentOrThrow, listPlayers } from "@/lib/tournament/queries";
import { DrawButton, LockButton } from "./AdminControls";
import { LogoutButton } from "./LogoutButton";
import { StartKnockoutButton } from "./StartKnockoutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const tournament = await getActiveTournamentOrThrow();
  const roster = await listPlayers(tournament.id);
  const active = roster.filter((p) => p.withdrawnAt === null).length;
  const expected =
    tournament.config.group_count * tournament.config.group_size;

  let groupMatchesPending = 0;
  let groupMatchesTotal = 0;
  if (tournament.status === "group_play") {
    const rows = await db
      .select({ status: matches.status })
      .from(matches)
      .where(
        and(
          eq(matches.tournamentId, tournament.id),
          eq(matches.phase, "group"),
        ),
      );
    groupMatchesTotal = rows.length;
    groupMatchesPending = rows.filter((r) => r.status === "pending").length;
  }

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold">Admin</h1>
          <p className="mt-2 text-fg-muted">
            {tournament.name} · status {tournament.status} · {active} of {expected} registered
          </p>
        </div>
        <LogoutButton />
      </header>

      <nav className="flex flex-col gap-3">
        <Link
          href="/admin/players"
          className="border border-fg-muted px-4 py-3 hover:border-fg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
        >
          Players →
        </Link>

        {tournament.status === "draft" && (
          <LockButton disabled={active !== expected} />
        )}

        {tournament.status === "locked" && <DrawButton />}

        {tournament.status === "group_play" && (
          <>
            <Link
              href="/admin/groups"
              className="border border-fg px-4 py-3 hover:bg-fg hover:text-bg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
            >
              Post Group Results →
            </Link>
            <Link
              href="/groups"
              className="border border-fg-muted px-4 py-3 hover:border-fg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
            >
              View Standings →
            </Link>
            <StartKnockoutButton disabled={groupMatchesPending > 0} />
          </>
        )}

        {tournament.status === "knockout" && (
          <>
            <Link
              href="/admin/knockout"
              className="border border-fg px-4 py-3 hover:bg-fg hover:text-bg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
            >
              Post Knockout Results →
            </Link>
            <Link
              href="/bracket"
              className="border border-fg-muted px-4 py-3 hover:border-fg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
            >
              View Bracket →
            </Link>
          </>
        )}

        {tournament.status === "done" && (
          <Link
            href="/bracket"
            className="border border-fg px-4 py-3 hover:bg-fg hover:text-bg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
          >
            View Champion →
          </Link>
        )}
      </nav>

      {tournament.status === "draft" && active !== expected && (
        <p className="mt-6 text-sm text-fg-muted">
          Add {expected - active} more player{expected - active === 1 ? "" : "s"} to enable Lock Registration.
        </p>
      )}

      {tournament.status === "group_play" && groupMatchesPending > 0 && (
        <p className="mt-6 text-sm text-fg-muted">
          Post results for {groupMatchesPending} more match
          {groupMatchesPending === 1 ? "" : "es"} to enable Start Knockout.
        </p>
      )}

      {tournament.status === "group_play" && groupMatchesTotal > 0 && groupMatchesPending === 0 && (
        <p className="mt-6 text-sm text-fg-muted">
          All group matches posted. Ready to seed the bracket.
        </p>
      )}
    </main>
  );
}
