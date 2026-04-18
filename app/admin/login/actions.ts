"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gte } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { db } from "@/lib/db";
import { authAttempts } from "@/lib/schema";
import {
  AUTH_RATE_LIMIT,
  AUTH_RATE_WINDOW_MINUTES,
  checkPin,
  getClientIp,
  type AdminSession,
} from "@/lib/auth";
import { getSessionOptions } from "@/lib/auth-session";

export type LoginResult = { ok: true; redirectTo: string } | { ok: false; error: string };

function safeNext(raw: string | null): string {
  if (!raw) return "/admin";
  if (!raw.startsWith("/admin")) return "/admin";
  if (raw.startsWith("//")) return "/admin";
  if (raw === "/admin/login") return "/admin";
  return raw;
}

export async function verifyPin(formData: FormData): Promise<LoginResult> {
  const pin = formData.get("pin");
  const rawNext = formData.get("next");
  const next = safeNext(typeof rawNext === "string" ? rawNext : null);

  const ip = getClientIp(await headers());
  const cutoff = new Date(Date.now() - AUTH_RATE_WINDOW_MINUTES * 60 * 1000);

  const recent = await db
    .select({ id: authAttempts.id, succeeded: authAttempts.succeeded })
    .from(authAttempts)
    .where(and(eq(authAttempts.ip, ip), gte(authAttempts.attemptAt, cutoff)));

  const recentFailures = recent.filter((r) => r.succeeded === false).length;

  const result = checkPin(
    pin,
    process.env.ADMIN_PIN,
    process.env.ADMIN_RECOVERY_PIN,
  );

  if (recentFailures >= AUTH_RATE_LIMIT && result !== "recovery") {
    await db.insert(authAttempts).values({ ip, succeeded: false });
    return {
      ok: false,
      error: `Too many attempts. Try again in ${AUTH_RATE_WINDOW_MINUTES} minutes or use the recovery PIN.`,
    };
  }

  if (result === "invalid") {
    await db.insert(authAttempts).values({ ip, succeeded: false });
    return { ok: false, error: "Incorrect PIN" };
  }

  await db.insert(authAttempts).values({ ip, succeeded: true });

  const session = await getIronSession<AdminSession>(
    await cookies(),
    getSessionOptions(),
  );
  session.isAuthenticated = true;
  session.loggedInAt = Date.now();
  await session.save();

  return { ok: true, redirectTo: next };
}

export async function logout(): Promise<void> {
  const session = await getIronSession<AdminSession>(
    await cookies(),
    getSessionOptions(),
  );
  session.destroy();
  redirect("/admin/login");
}
