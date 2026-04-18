import { describe, it, expect } from "vitest";
import { BRACKET_SIZE, downstreamSlot, seedBracket } from "./bracket";
import type { Qualifier } from "./wildcards";

const q = (
  playerId: string,
  wins: number,
  gamesPlayed: number,
  pointsScored: number,
  pointsAgainst: number,
  type: Qualifier["qualifierType"] = "group_winner",
): Qualifier => ({
  playerId,
  sourceGroupPosition: 1,
  sourceGroupId: "g",
  sourceRank: 1,
  qualifierType: type,
  wins,
  gamesPlayed,
  pointsScored,
  pointDiff: pointsScored - pointsAgainst,
  winRate: gamesPlayed === 0 ? 0 : wins / gamesPlayed,
  ptsPerGame: gamesPlayed === 0 ? 0 : pointsScored / gamesPlayed,
  diffPerGame: gamesPlayed === 0 ? 0 : (pointsScored - pointsAgainst) / gamesPlayed,
});

describe("seedBracket", () => {
  it("assigns seeds 1-8 strictly by per-game waterfall", () => {
    const qualifiers = [
      q("s1", 4, 4, 80, 20),
      q("s2", 4, 4, 75, 25),
      q("s3", 3, 4, 70, 35),
      q("s4", 3, 4, 65, 40),
      q("s5", 3, 4, 60, 45),
      q("s6", 2, 4, 55, 50),
      q("s7", 2, 4, 50, 55),
      q("s8", 1, 4, 40, 60),
    ];
    const result = seedBracket({ qualifiers, seedInputs: ["t"] });
    expect(result.seeds.map((s) => ({ seed: s.seed, id: s.playerId }))).toEqual([
      { seed: 1, id: "s1" },
      { seed: 2, id: "s2" },
      { seed: 3, id: "s3" },
      { seed: 4, id: "s4" },
      { seed: 5, id: "s5" },
      { seed: 6, id: "s6" },
      { seed: 7, id: "s7" },
      { seed: 8, id: "s8" },
    ]);
  });

  it("produces QF pairings 1v8, 4v5, 3v6, 2v7", () => {
    const qualifiers = [
      q("s1", 4, 4, 80, 20),
      q("s2", 4, 4, 75, 25),
      q("s3", 3, 4, 70, 35),
      q("s4", 3, 4, 65, 40),
      q("s5", 3, 4, 60, 45),
      q("s6", 2, 4, 55, 50),
      q("s7", 2, 4, 50, 55),
      q("s8", 1, 4, 40, 60),
    ];
    const { slots } = seedBracket({ qualifiers, seedInputs: ["t"] });
    const qf = slots.filter((s) => s.phase === "qf");
    expect(qf).toHaveLength(4);
    expect(qf[0]).toMatchObject({ slot: 1, playerAId: "s1", playerBId: "s8" });
    expect(qf[1]).toMatchObject({ slot: 2, playerAId: "s4", playerBId: "s5" });
    expect(qf[2]).toMatchObject({ slot: 3, playerAId: "s3", playerBId: "s6" });
    expect(qf[3]).toMatchObject({ slot: 4, playerAId: "s2", playerBId: "s7" });
  });

  it("produces SF/Final shells with null player ids", () => {
    const qualifiers = [
      q("s1", 4, 4, 80, 20),
      q("s2", 4, 4, 75, 25),
      q("s3", 3, 4, 70, 35),
      q("s4", 3, 4, 65, 40),
      q("s5", 3, 4, 60, 45),
      q("s6", 2, 4, 55, 50),
      q("s7", 2, 4, 50, 55),
      q("s8", 1, 4, 40, 60),
    ];
    const { slots } = seedBracket({ qualifiers, seedInputs: ["t"] });
    const sf = slots.filter((s) => s.phase === "sf");
    expect(sf.map((s) => s.slot)).toEqual([5, 6]);
    for (const s of sf) {
      expect(s.playerAId).toBeNull();
      expect(s.playerBId).toBeNull();
    }
    const final = slots.find((s) => s.phase === "final");
    expect(final?.slot).toBe(7);
    expect(final?.playerAId).toBeNull();
    expect(final?.playerBId).toBeNull();
  });

  it("uses RNG for ties, deterministic for fixed seed", () => {
    const qualifiers = [
      q("a", 3, 4, 60, 40),
      q("b", 3, 4, 60, 40),
      q("c", 3, 4, 60, 40),
      q("d", 3, 4, 60, 40),
      q("e", 3, 4, 60, 40),
      q("f", 3, 4, 60, 40),
      q("g", 3, 4, 60, 40),
      q("h", 3, 4, 60, 40),
    ];
    const r1 = seedBracket({ qualifiers, seedInputs: ["seed-x"] });
    const r2 = seedBracket({ qualifiers, seedInputs: ["seed-x"] });
    expect(r1.seeds.map((s) => s.playerId)).toEqual(
      r2.seeds.map((s) => s.playerId),
    );
  });

  it("rejects the wrong number of qualifiers", () => {
    expect(() =>
      seedBracket({ qualifiers: [], seedInputs: ["t"] }),
    ).toThrow(/8 qualifiers/);
    expect(() =>
      seedBracket({
        qualifiers: Array.from({ length: 7 }, (_, i) =>
          q(`p${i}`, 3, 4, 50, 40),
        ),
        seedInputs: ["t"],
      }),
    ).toThrow(/8 qualifiers/);
  });

  it("rejects duplicate qualifier playerIds", () => {
    const qualifiers = [
      q("a", 4, 4, 80, 20),
      q("b", 4, 4, 75, 25),
      q("c", 3, 4, 70, 35),
      q("d", 3, 4, 65, 40),
      q("e", 3, 4, 60, 45),
      q("f", 2, 4, 55, 50),
      q("g", 2, 4, 50, 55),
      q("a", 1, 4, 40, 60),
    ];
    expect(() =>
      seedBracket({ qualifiers, seedInputs: ["t"] }),
    ).toThrow(/duplicate/);
  });

  it("uses diff-per-game as the final non-RNG tiebreaker when win-rate and pts-per-game match", () => {
    const qualifiers = [
      q("a", 4, 4, 80, 20),
      q("b", 3, 4, 60, 30),
      q("c", 3, 4, 60, 45),
      q("d", 3, 4, 55, 40),
      q("e", 2, 4, 50, 50),
      q("f", 2, 4, 40, 55),
      q("g", 1, 4, 30, 60),
      q("h", 0, 4, 20, 80),
    ];
    const { seeds } = seedBracket({ qualifiers, seedInputs: ["t"] });
    const bSeed = seeds.find((s) => s.playerId === "b")!;
    const cSeed = seeds.find((s) => s.playerId === "c")!;
    expect(bSeed.seed).toBeLessThan(cSeed.seed);
  });

  it("exposes BRACKET_SIZE constant", () => {
    expect(BRACKET_SIZE).toBe(8);
  });
});

describe("downstreamSlot", () => {
  it("maps QF slot 1 to SF slot 5 side A", () => {
    expect(downstreamSlot(1)).toEqual({ slot: 5, side: "a" });
  });
  it("maps QF slot 2 to SF slot 5 side B", () => {
    expect(downstreamSlot(2)).toEqual({ slot: 5, side: "b" });
  });
  it("maps QF slot 3 to SF slot 6 side A", () => {
    expect(downstreamSlot(3)).toEqual({ slot: 6, side: "a" });
  });
  it("maps QF slot 4 to SF slot 6 side B", () => {
    expect(downstreamSlot(4)).toEqual({ slot: 6, side: "b" });
  });
  it("maps SF slot 5 to Final slot 7 side A", () => {
    expect(downstreamSlot(5)).toEqual({ slot: 7, side: "a" });
  });
  it("maps SF slot 6 to Final slot 7 side B", () => {
    expect(downstreamSlot(6)).toEqual({ slot: 7, side: "b" });
  });
  it("returns null for the final slot", () => {
    expect(downstreamSlot(7)).toBeNull();
  });
  it("returns null for unknown slots", () => {
    expect(downstreamSlot(999)).toBeNull();
  });
});
