export const MAX_NAME_LENGTH = 40;

export type NameValidation =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function validatePlayerName(raw: unknown): NameValidation {
  if (typeof raw !== "string") {
    return { ok: false, error: "Name is required" };
  }
  const name = raw.trim();
  if (name.length === 0) return { ok: false, error: "Name is required" };
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` };
  }
  return { ok: true, name };
}
