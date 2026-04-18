import { describe, it, expect } from "vitest";
import { fnv1aHash, mulberry32, seededRng, shuffle } from "./random";

describe("fnv1aHash", () => {
  it("is deterministic", () => {
    expect(fnv1aHash("hello")).toBe(fnv1aHash("hello"));
  });

  it("differs for different inputs", () => {
    expect(fnv1aHash("hello")).not.toBe(fnv1aHash("world"));
  });

  it("returns an unsigned 32-bit integer", () => {
    const h = fnv1aHash("a long-ish string to hash");
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
    expect(Number.isInteger(h)).toBe(true);
  });
});

describe("mulberry32", () => {
  it("produces the same sequence from the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences from different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("outputs values in [0, 1)", () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("seededRng", () => {
  it("is order-independent across the inputs", () => {
    const a = seededRng(["p1", "p2", "p3"]);
    const b = seededRng(["p3", "p1", "p2"]);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it("produces different sequences for different seed sets", () => {
    const a = seededRng(["p1", "p2"]);
    const b = seededRng(["p1", "p2", "p3"]);
    expect(a()).not.toBe(b());
  });
});

describe("shuffle", () => {
  it("returns a new array with the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const rng = mulberry32(7);
    const out = shuffle(input, rng);
    expect(out).not.toBe(input);
    expect(out.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("is deterministic for a given seed", () => {
    const input = ["a", "b", "c", "d"];
    const s1 = shuffle(input, mulberry32(5));
    const s2 = shuffle(input, mulberry32(5));
    expect(s1).toEqual(s2);
  });

  it("handles empty and single-element arrays", () => {
    const rng = mulberry32(1);
    expect(shuffle([], rng)).toEqual([]);
    expect(shuffle([42], rng)).toEqual([42]);
  });
});
