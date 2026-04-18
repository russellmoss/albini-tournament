import { getIronSession, type SessionOptions } from "iron-session";
import type { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type AdminSession,
} from "./auth";

export function getSessionOptions(): SessionOptions {
  const password = process.env.AUTH_SECRET;
  if (!password) throw new Error("AUTH_SECRET is not set");
  return {
    password,
    cookieName: ADMIN_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  };
}

export async function getAdminSessionFromRequest(
  req: NextRequest,
  res: NextResponse,
) {
  return getIronSession<AdminSession>(req, res, getSessionOptions());
}
