import { describe, it, expect } from "vitest";
import type { StandingRow } from "./standings";
import { selectQualifiers, type GroupStanding } from "./wildcards";

const row = (
  playerId: string,
  rank: number,
  wins: number,
  gamesPlayed: number,
  pointsScored: number,
  pointsAgainst: number,
): StandingRow => ({
  playerId,
  rank,
  gamesPlayed,
  wins,
  losses: gamesPlayed - wins,
  pointsScored,
  pointsAgainst,
  pointDiff: pointsScored - pointsAgainst,
  winRate: gamesPlayed === 0 ? 0 : wins / gamesPlayed,
  ptsPerGame: gamesPlayed === 0 ? 0 : pointsScored / gamesPlayed,
  diffPerGame: gamesPlayed === 0 ? 0 : (pointsScored - pointsAgainst) / gamesPlayed,
  tiebreak: "none",
});

const group = (
  groupId: string,
  position: number,
  standings: StandingRow[],
): GroupStanding => ({
  groupId,
  groupPosition: position,
  standings,
});

describe("selectQualifiers", () => {
  it("returns top-N from each group as group_winners", () => {
    const input = {
      groups: [
        group("g1", 1, [
          row("a", 1, 4, 4, 80, 30),
          row("b", 2, 3, 4, 70, 40),
          row("c", 3, 1, 4, 40, 60),
          row("d", 4, 0, 4, 30, 70),
          row("e", 5, 0, 4, 20, 80),
        ]),
        group("g2", 2, [
          row("f", 1, 4, 4, 80, 30),
          row("g", 2, 3, 4, 70, 40),
          row("h", 3, 2, 4, 50, 50),
          row("i", 4, 1, 4, 40, 60),
          row("j", 5, 0, 4, 20, 80),
        ]),
        group("g3", 3, [
          row("k", 1, 4, 4, 80, 30),
          row("l", 2, 3, 4, 70, 40),
          row("m", 3, 2, 4, 50, 50),
          row("n", 4, 1, 4, 40, 60),
          row("o", 5, 0, 4, 20, 80),
        ]),
      ],
      advanceTop: 2,
      wildcardCount: 2,
      seedInputs: ["t"],
    };
    const result = selectQualifiers(input);
    expect(result.groupWinners).toHaveLength(6);
    expect(result.groupWinners.map((q) => q.playerId).sort()).toEqual([
      "a",
      "b",
      "f",
      "g",
      "k",
      "l",
    ]);
    for (const q of result.groupWinners) {
      expect(q.qualifierType).toBe("group_winner");
    }
  });

  it("picks wildcards from best-of-rest by per-game waterfall", () => {
    const input = {
      groups: [
        group("g1", 1, [
          row("a", 1, 4, 4, 80, 30),
          row("b", 2, 3, 4, 70, 40),
          row("c", 3, 2, 4, 60, 50),
          row("d", 4, 0, 4, 10, 80),
          row("e", 5, 0, 4, 0, 80),
        ]),
        group("g2", 2, [
          row("f", 1, 4, 4, 80, 30),
          row("g", 2, 3, 4, 70, 40),
          row("h", 3, 2, 4, 40, 40),
          row("i", 4, 1, 4, 20, 60),
          row("j", 5, 0, 4, 10, 80),
        ]),
        group("g3", 3, [
          row("k", 1, 4, 4, 80, 30),
          row("l", 2, 3, 4, 70, 40),
          row("m", 3, 1, 4, 55, 60),
          row("n", 4, 1, 4, 45, 60),
          row("o", 5, 0, 4, 20, 80),
        ]),
      ],
      advanceTop: 2,
      wildcardCount: 2,
      seedInputs: ["t"],
    };
    const result = selectQualifiers(input);
    expect(result.wildcards).toHaveLength(2);
    const wildcardIds = result.wildcards.map((w) => w.playerId);
    expect(wildcardIds).toContain("c");
    expect(wildcardIds).toContain("h");
    for (const w of result.wildcards) {
      expect(w.qualifierType).toBe("wildcard");
      expect(w.sourceRank).toBeGreaterThan(2);
    }
  });

  it("tie-breaks wildcards by pts-per-game when win rates match", () => {
    const input = {
      groups: [
        group("g1", 1, [
          row("a", 1, 4, 4, 80, 30),
          row("b", 2, 3, 4, 70, 40),
          row("c", 3, 2, 4, 80, 40),
          row("d", 4, 2, 4, 40, 60),
          row("e", 5, 0, 4, 10, 90),
        ]),
        group("g2", 2, [
          row("f", 1, 4, 4, 80, 30),
          row("g", 2, 3, 4, 70, 40),
          row("h", 3, 2, 4, 60, 50),
          row("i", 4, 1, 4, 30, 60),
          row("j", 5, 0, 4, 20, 80),
        ]),
      ],
      advanceTop: 2,
      wildcardCount: 1,
      seedInputs: ["t"],
    };
    const result = selectQualifiers(input);
    expect(result.wildcards).toHaveLength(1);
    expect(result.wildcards[0].playerId).toBe("c");
  });

  it("tie-breaks by diff-per-game when win rate and pts-per-game match", () => {
    const input = {
      groups: [
        group("g1", 1, [
          row("a", 1, 4, 4, 80, 30),
          row("b", 2, 3, 4, 70, 40),
          row("c", 3, 2, 4, 60, 50),
          row("d", 4, 1, 4, 20, 70),
          row("e", 5, 0, 4, 10, 90),
        ]),
        group("g2", 2, [
          row("f", 1, 4, 4, 80, 30),
          row("g", 2, 3, 4, 70, 40),
          row("h", 3, 2, 4, 60, 30),
          row("i", 4, 1, 4, 20, 60),
          row("j", 5, 0, 4, 10, 80),
        ]),
      ],
      advanceTop: 2,
      wildcardCount: 1,
      seedInputs: ["t"],
    };
    const result = selectQualifiers(input);
    expect(result.wildcards[0].playerId).toBe("h");
  });

  it("uses RNG to break ties when per-game metrics are identical", () => {
    const input = {
      groups: [
        group("g1", 1, [
          row("a", 1, 4, 4, 80, 30),
          row("b", 2, 3, 4, 70, 40),
          row("c", 3, 2, 4, 60, 40),
          row("d", 4, 1, 4, 10, 60),
          row("e", 5, 0, 4, 0, 80),
        ]),
        group("g2", 2, [
          row("f", 1, 4, 4, 80, 30),
          row("g", 2, 3, 4, 70, 40),
          row("h", 3, 2, 4, 60, 40),
          row("i", 4, 1, 4, 10, 60),
          row("j", 5, 0, 4, 0, 80),
        ]),
      ],
      advanceTop: 2,
      wildcardCount: 1,
      seedInputs: ["seed-abc"],
    };
    const result1 = selectQualifiers(input);
    const result2 = selectQualifiers(input);
    expect(result1.wildcards.map((w) => w.playerId)).toEqual(
      result2.wildcards.map((w) => w.playerId),
    );
    expect(["c", "h"]).toContain(result1.wildcards[0].playerId);
  });

  it("selects all tied players when they all fit under the wildcard cap", () => {
    const input = {
      groups: [
        group("g1", 1, [
          row("a", 1, 4, 4, 80, 30),
          row("b", 2, 3, 4, 70, 40),
          row("c", 3, 2, 4, 60, 40),
          row("d", 4, 1, 4, 30, 60),
          row("e", 5, 0, 4, 10, 80),
        ]),
        group("g2", 2, [
          row("f", 1, 4, 4, 80, 30),
          row("g", 2, 3, 4, 70, 40),
          row("h", 3, 2, 4, 60, 40),
          row("i", 4, 1, 4, 30, 60),
          row("j", 5, 0, 4, 10, 80),
        ]),
      ],
      advanceTop: 2,
      wildcardCount: 2,
      seedInputs: ["t"],
    };
    const result = selectQualifiers(input);
    expect(new Set(result.wildcards.map((w) => w.playerId))).toEqual(
      new Set(["c", "h"]),
    );
  });

  it("returns no wildcards when wildcardCount is 0", () => {
    const input = {
      groups: [
        group("g1", 1, [
          row("a", 1, 4, 4, 80, 30),
          row("b", 2, 3, 4, 70, 40),
          row("c", 3, 2, 4, 60, 50),
        ]),
      ],
      advanceTop: 2,
      wildcardCount: 0,
      seedInputs: ["t"],
    };
    const result = selectQualifiers(input);
    expect(result.wildcards).toHaveLength(0);
    expect(result.groupWinners).toHaveLength(2);
  });

  it("throws when there aren't enough wildcard candidates", () => {
    expect(() =>
      selectQualifiers({
        groups: [
          group("g1", 1, [
            row("a", 1, 4, 4, 80, 30),
            row("b", 2, 3, 4, 70, 40),
          ]),
        ],
        advanceTop: 2,
        wildcardCount: 2,
        seedInputs: ["t"],
      }),
    ).toThrow(/candidates available/);
  });

  it("rejects invalid sizes", () => {
    expect(() =>
      selectQualifiers({
        groups: [],
        advanceTop: 2,
        wildcardCount: 2,
        seedInputs: ["t"],
      }),
    ).toThrow(/groups/);
    expect(() =>
      selectQualifiers({
        groups: [group("g1", 1, [])],
        advanceTop: 0,
        wildcardCount: 2,
        seedInputs: ["t"],
      }),
    ).toThrow(/advanceTop/);
    expect(() =>
      selectQualifiers({
        groups: [group("g1", 1, [])],
        advanceTop: 2,
        wildcardCount: -1,
        seedInputs: ["t"],
      }),
    ).toThrow(/wildcardCount/);
  });
});
