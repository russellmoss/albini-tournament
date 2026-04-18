export type AdminSession = {
  isAuthenticated?: boolean;
  loggedInAt?: number;
};

export const ADMIN_COOKIE_NAME = "albini_admin";

export const AUTH_RATE_LIMIT = 5;
export const AUTH_RATE_WINDOW_MINUTES = 10;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export type PinCheck = "admin" | "recovery" | "invalid";

export function checkPin(
  submitted: unknown,
  adminPin: string | undefined,
  recoveryPin: string | undefined,
): PinCheck {
  if (typeof submitted !== "string" || submitted.length === 0) return "invalid";
  if (adminPin && submitted === adminPin) return "admin";
  if (recoveryPin && submitted === recoveryPin) return "recovery";
  return "invalid";
}
