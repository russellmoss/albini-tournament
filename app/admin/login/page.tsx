import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

type SearchParams = { next?: string | string[] };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = rawNext && rawNext.startsWith("/admin") ? rawNext : "/admin";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border border-fg bg-bg-card p-8">
        <h1 className="text-2xl md:text-3xl font-extrabold">Admin</h1>
        <p className="mt-1 text-fg-muted text-sm">Enter PIN to continue</p>
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-xs text-fg-muted">
          <Link href="/" className="underline hover:text-fg">
            ← Back to public view
          </Link>
        </p>
      </div>
    </main>
  );
}
