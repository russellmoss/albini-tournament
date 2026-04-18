import { describe, it, expect } from "vitest";
import { checkPin, getClientIp } from "./auth";

describe("checkPin", () => {
  it("returns 'admin' on admin match", () => {
    expect(checkPin("1234", "1234", "9999")).toBe("admin");
  });

  it("returns 'recovery' on recovery match", () => {
    expect(checkPin("9999", "1234", "9999")).toBe("recovery");
  });

  it("returns 'admin' when admin and recovery are equal and input matches", () => {
    expect(checkPin("42069", "42069", "42069")).toBe("admin");
  });

  it("returns 'invalid' when no match", () => {
    expect(checkPin("0000", "1234", "9999")).toBe("invalid");
  });

  it("returns 'invalid' on non-string input", () => {
    expect(checkPin(null, "1234", "9999")).toBe("invalid");
    expect(checkPin(undefined, "1234", "9999")).toBe("invalid");
    expect(checkPin(42, "1234", "9999")).toBe("invalid");
  });

  it("returns 'invalid' on empty string", () => {
    expect(checkPin("", "1234", "9999")).toBe("invalid");
  });

  it("does not match when admin PIN is missing from env", () => {
    expect(checkPin("1234", undefined, undefined)).toBe("invalid");
  });

  it("does not match recovery when only recovery is set and input doesn't match", () => {
    expect(checkPin("0000", undefined, "9999")).toBe("invalid");
  });
});

describe("getClientIp", () => {
  it("prefers the first ip in x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("trims whitespace around the first ip", () => {
    const headers = new Headers({ "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "9.8.7.6" });
    expect(getClientIp(headers)).toBe("9.8.7.6");
  });

  it("returns 'unknown' when neither header is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });

  it("treats empty x-forwarded-for as missing and falls through", () => {
    const headers = new Headers({
      "x-forwarded-for": "",
      "x-real-ip": "5.5.5.5",
    });
    expect(getClientIp(headers)).toBe("5.5.5.5");
  });

  it("falls through when x-forwarded-for's first segment is empty", () => {
    const headers = new Headers({
      "x-forwarded-for": " ,1.2.3.4",
      "x-real-ip": "5.5.5.5",
    });
    expect(getClientIp(headers)).toBe("5.5.5.5");
  });
});
