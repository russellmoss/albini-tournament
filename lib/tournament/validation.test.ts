import { describe, it, expect } from "vitest";
import { validatePlayerName, MAX_NAME_LENGTH } from "./validation";

describe("validatePlayerName", () => {
  it("accepts a trimmed name", () => {
    expect(validatePlayerName("  Steve  ")).toEqual({ ok: true, name: "Steve" });
  });

  it("rejects non-string input", () => {
    expect(validatePlayerName(null)).toEqual({ ok: false, error: "Name is required" });
    expect(validatePlayerName(42)).toEqual({ ok: false, error: "Name is required" });
    expect(validatePlayerName(undefined)).toEqual({ ok: false, error: "Name is required" });
  });

  it("rejects empty or whitespace-only names", () => {
    expect(validatePlayerName("")).toEqual({ ok: false, error: "Name is required" });
    expect(validatePlayerName("   ")).toEqual({ ok: false, error: "Name is required" });
  });

  it("rejects names over the max length", () => {
    const long = "x".repeat(MAX_NAME_LENGTH + 1);
    const result = validatePlayerName(long);
    expect(result.ok).toBe(false);
  });

  it("accepts names at exactly the max length", () => {
    const exact = "x".repeat(MAX_NAME_LENGTH);
    expect(validatePlayerName(exact)).toEqual({ ok: true, name: exact });
  });
});
