import Link from "next/link";
import { getActiveTournamentOrThrow, listPlayers } from "@/lib/tournament/queries";
import { RegisterForm } from "./RegisterForm";
import { WithdrawButton, DeleteButton } from "./PlayerActions";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const tournament = await getActiveTournamentOrThrow();
  const roster = await listPlayers(tournament.id);
  const active = roster.filter((p) => p.withdrawnAt === null);
  const withdrawn = roster.filter((p) => p.withdrawnAt !== null);
  const canRegister = tournament.status === "draft";

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
      <nav className="mb-6 text-sm">
        <Link href="/admin" className="text-fg-muted underline hover:text-fg">
          ← Admin
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold">Players</h1>
        <p className="mt-2 text-fg-muted">
          {tournament.name} · status {tournament.status} · {active.length} registered
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Add player</h2>
        {canRegister ? (
          <RegisterForm />
        ) : (
          <p className="text-sm text-fg-muted">
            Registration is locked. Status is{" "}
            <span className="text-fg">{tournament.status}</span>.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Roster</h2>
        {active.length === 0 && withdrawn.length === 0 ? (
          <p className="text-sm text-fg-muted">Add the first player.</p>
        ) : (
          <ul className="divide-y divide-fg-muted/40 border border-fg-muted">
            {active.map((p, idx) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span>
                  <span className="text-fg-muted mr-3 tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {p.name}
                </span>
                {canRegister ? (
                  <DeleteButton playerId={p.id} />
                ) : (
                  <WithdrawButton playerId={p.id} />
                )}
              </li>
            ))}
            {withdrawn.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3 text-fg-muted"
              >
                <span>
                  {p.name} <span className="ml-2 text-xs">(withdrawn)</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
