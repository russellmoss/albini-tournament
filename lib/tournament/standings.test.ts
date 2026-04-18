import { describe, it, expect } from "vitest";
import { computeStats, rankGroup, type HeadToHeadMatch } from "./standings";

const m = (
  a: string,
  b: string,
  aPts: number,
  bPts: number,
): HeadToHeadMatch => ({
  playerAId: a,
  playerBId: b,
  playerAPoints: aPts,
  playerBPoints: bPts,
});

describe("computeStats", () => {
  it("returns zeros for players with no matches", () => {
    const s = computeStats(["a"], []);
    expect(s[0]).toMatchObject({
      playerId: "a",
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      pointsScored: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      winRate: 0,
      ptsPerGame: 0,
      diffPerGame: 0,
    });
  });

  it("accumulates points, wins, and losses correctly", () => {
    const matches = [m("a", "b", 20, 15), m("b", "a", 18, 10)];
    const stats = computeStats(["a", "b"], matches);
    const a = stats.find((s) => s.playerId === "a")!;
    const b = stats.find((s) => s.playerId === "b")!;
    expect(a).toMatchObject({
      gamesPlayed: 2,
      wins: 1,
      losses: 1,
      pointsScored: 30,
      pointsAgainst: 33,
      pointDiff: -3,
    });
    expect(b).toMatchObject({
      gamesPlayed: 2,
      wins: 1,
      losses: 1,
      pointsScored: 33,
      pointsAgainst: 30,
      pointDiff: 3,
    });
  });

  it("computes per-game rates correctly", () => {
    const stats = computeStats(["a", "b"], [m("a", "b", 20, 10)]);
    const a = stats.find((s) => s.playerId === "a")!;
    expect(a.winRate).toBe(1);
    expect(a.ptsPerGame).toBe(20);
    expect(a.diffPerGame).toBe(10);
  });

  it("ignores matches involving unlisted players", () => {
    const stats = computeStats(["a", "b"], [m("c", "d", 10, 5)]);
    expect(stats.every((s) => s.gamesPlayed === 0)).toBe(true);
  });

  it("treats tied scores as no-win-no-loss (shouldn't happen post SD, but is defensive)", () => {
    const stats = computeStats(["a", "b"], [m("a", "b", 15, 15)]);
    const a = stats.find((s) => s.playerId === "a")!;
    const b = stats.find((s) => s.playerId === "b")!;
    expect(a.wins).toBe(0);
    expect(b.wins).toBe(0);
    expect(a.losses).toBe(0);
    expect(b.losses).toBe(0);
    expect(a.gamesPlayed).toBe(1);
  });
});

describe("rankGroup", () => {
  it("sorts strictly by wins first", () => {
    const matches = [
      m("a", "b", 10, 20),
      m("a", "c", 10, 20),
      m("b", "c", 20, 10),
    ];
    const rows = rankGroup({
      playerIds: ["a", "b", "c"],
      matches,
      seedInputs: ["t"],
    });
    expect(rows.map((r) => r.playerId)).toEqual(["b", "c", "a"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("breaks equal wins by total points scored", () => {
    const matches = [
      m("a", "b", 30, 20),
      m("a", "c", 10, 15),
      m("b", "c", 25, 24),
    ];
    const rows = rankGroup({
      playerIds: ["a", "b", "c"],
      matches,
      seedInputs: ["t"],
    });
    const ids = rows.map((r) => r.playerId);
    expect(ids[0]).toBe("b");
  });

  it("uses head-to-head diff for 2-way ties on wins+points (a beats b)", () => {
    const matches = [
      m("a", "b", 20, 15),
      m("a", "c", 20, 10),
      m("a", "d", 10, 20),
      m("b", "c", 20, 10),
      m("b", "d", 15, 10),
      m("c", "d", 15, 10),
    ];
    const rows = rankGroup({
      playerIds: ["a", "b", "c", "d"],
      matches,
      seedInputs: ["t"],
    });
    const a = rows.find((r) => r.playerId === "a")!;
    const b = rows.find((r) => r.playerId === "b")!;
    expect(a.wins).toBe(2);
    expect(b.wins).toBe(2);
    expect(a.pointsScored).toBe(b.pointsScored);
    expect(a.rank).toBeLessThan(b.rank);
    expect(a.tiebreak).toBe("h2h");
    expect(b.tiebreak).toBe("h2h");
  });

  it("head-to-head promotes winner even when they appear second in the primary-sort bucket", () => {
    const matches = [
      m("a", "b", 20, 15),
      m("a", "c", 20, 10),
      m("a", "d", 10, 20),
      m("b", "c", 20, 10),
      m("b", "d", 15, 10),
      m("c", "d", 15, 10),
    ];
    const rows = rankGroup({
      playerIds: ["b", "a", "c", "d"],
      matches,
      seedInputs: ["t"],
    });
    const a = rows.find((r) => r.playerId === "a")!;
    const b = rows.find((r) => r.playerId === "b")!;
    expect(a.wins).toBe(2);
    expect(b.wins).toBe(2);
    expect(a.rank).toBeLessThan(b.rank);
    expect(a.tiebreak).toBe("h2h");
    expect(b.tiebreak).toBe("h2h");
  });

  it("falls back to coin-flip for a 2-way tie with no direct match recorded", () => {
    const input = {
      playerIds: ["a", "b"],
      matches: [] as HeadToHeadMatch[],
      seedInputs: ["t"],
    };
    const rows = rankGroup(input);
    expect(rows[0].tiebreak).toBe("coin-flip");
    expect(rows[1].tiebreak).toBe("coin-flip");
    const repeat = rankGroup(input);
    expect(repeat.map((r) => r.playerId)).toEqual(rows.map((r) => r.playerId));
  });

  it("falls back to coin-flip when head-to-head diff is zero", () => {
    const matches = [m("a", "b", 15, 15), m("a", "c", 20, 10), m("b", "c", 20, 10)];
    const rows = rankGroup({
      playerIds: ["a", "b", "c"],
      matches,
      seedInputs: ["t"],
    });
    const a = rows.find((r) => r.playerId === "a")!;
    const b = rows.find((r) => r.playerId === "b")!;
    expect(a.tiebreak).toBe("coin-flip");
    expect(b.tiebreak).toBe("coin-flip");
  });

  it("3+-way tie where sub-table cleanly separates each player", () => {
    const matches = [
      m("a", "b", 30, 0),
      m("a", "c", 30, 0),
      m("b", "c", 30, 0),
      m("a", "d", 0, 10),
      m("a", "e", 0, 10),
      m("b", "d", 30, 0),
      m("b", "e", 0, 10),
      m("c", "d", 30, 0),
      m("c", "e", 30, 0),
      m("d", "e", 0, 10),
    ];
    const rows = rankGroup({
      playerIds: ["a", "b", "c", "d", "e"],
      matches,
      seedInputs: ["t"],
    });
    expect(rows[0].playerId).toBe("e");
    expect(rows.slice(1, 4).map((r) => r.playerId)).toEqual(["a", "b", "c"]);
    for (const r of rows.slice(1, 4)) {
      expect(r.tiebreak).toBe("sub-table");
    }
    expect(rows[4].playerId).toBe("d");
  });

  it("sub-table breaks ties on pointsScored and on pointDiff when wins match", () => {
    const matches = [
      m("a", "b", 20, 5),
      m("a", "c", 15, 20),
      m("b", "c", 20, 5),
      m("a", "d", 30, 10),
      m("a", "e", 15, 30),
      m("b", "d", 30, 5),
      m("b", "e", 25, 30),
      m("c", "d", 10, 30),
      m("c", "e", 45, 10),
      m("d", "e", 20, 30),
    ];
    const rows = rankGroup({
      playerIds: ["a", "b", "c", "d", "e"],
      matches,
      seedInputs: ["t"],
    });
    expect(rows[0].playerId).toBe("e");
    expect(rows.slice(1, 4).map((r) => r.playerId)).toEqual(["a", "b", "c"]);
    for (const r of rows.slice(1, 4)) {
      expect(r.tiebreak).toBe("sub-table");
    }
    expect(rows[4].playerId).toBe("d");
  });

  it("resolves 3+-way ties via a sub-table on only the tied players' matches", () => {
    const matches = [
      m("a", "b", 20, 10),
      m("b", "c", 20, 10),
      m("c", "a", 20, 10),
      m("a", "d", 15, 10),
      m("b", "d", 15, 10),
      m("c", "d", 15, 5),
    ];
    const rows = rankGroup({
      playerIds: ["a", "b", "c", "d"],
      matches,
      seedInputs: ["t"],
    });
    expect(rows[rows.length - 1].playerId).toBe("d");
    const top = rows.slice(0, 3).map((r) => r.playerId).sort();
    expect(top).toEqual(["a", "b", "c"]);
    for (const r of rows.slice(0, 3)) {
      expect(["sub-table", "coin-flip"]).toContain(r.tiebreak);
    }
  });

  it("sub-table ordering uses sub-table diff when wins+points are equal there too", () => {
    const matches = [
      m("a", "b", 20, 10),
      m("b", "c", 20, 10),
      m("c", "a", 20, 10),
      m("a", "d", 15, 10),
      m("b", "d", 15, 10),
      m("c", "d", 15, 10),
    ];
    const rows = rankGroup({
      playerIds: ["a", "b", "c", "d"],
      matches,
      seedInputs: ["seed-xyz"],
    });
    const top3 = rows.slice(0, 3);
    expect(new Set(top3.map((r) => r.tiebreak))).toEqual(new Set(["coin-flip"]));
    const repeat = rankGroup({
      playerIds: ["a", "b", "c", "d"],
      matches,
      seedInputs: ["seed-xyz"],
    });
    expect(repeat.map((r) => r.playerId)).toEqual(rows.map((r) => r.playerId));
  });

  it("deterministic seed ⇒ same RNG-broken order across calls", () => {
    const matches: HeadToHeadMatch[] = [];
    const a = rankGroup({
      playerIds: ["x", "y", "z", "w"],
      matches,
      seedInputs: ["tournament-1", "x", "y", "z", "w"],
    });
    const b = rankGroup({
      playerIds: ["x", "y", "z", "w"],
      matches,
      seedInputs: ["tournament-1", "x", "y", "z", "w"],
    });
    expect(a.map((r) => r.playerId)).toEqual(b.map((r) => r.playerId));
  });

  it("different seeds ⇒ possibly different RNG-broken order", () => {
    const matches: HeadToHeadMatch[] = [];
    const a = rankGroup({
      playerIds: ["x", "y", "z", "w"],
      matches,
      seedInputs: ["seed-a"],
    });
    const b = rankGroup({
      playerIds: ["x", "y", "z", "w"],
      matches,
      seedInputs: ["seed-b"],
    });
    expect([a.map((r) => r.playerId), b.map((r) => r.playerId)]).toBeDefined();
    const combined = [...a, ...b];
    expect(combined.every((r) => r.tiebreak === "coin-flip")).toBe(true);
  });

  it("leaves single-player bucket marked tiebreak='none'", () => {
    const matches = [m("a", "b", 20, 10), m("a", "c", 20, 10), m("b", "c", 20, 15)];
    const rows = rankGroup({
      playerIds: ["a", "b", "c"],
      matches,
      seedInputs: ["t"],
    });
    expect(rows[0].playerId).toBe("a");
    expect(rows[0].tiebreak).toBe("none");
  });

  it("assigns ranks 1..N sequentially", () => {
    const matches = [
      m("a", "b", 20, 10),
      m("a", "c", 20, 10),
      m("a", "d", 20, 10),
      m("a", "e", 20, 10),
      m("b", "c", 15, 10),
      m("b", "d", 15, 10),
      m("b", "e", 15, 10),
      m("c", "d", 12, 10),
      m("c", "e", 12, 10),
      m("d", "e", 20, 0),
    ];
    const rows = rankGroup({
      playerIds: ["a", "b", "c", "d", "e"],
      matches,
      seedInputs: ["t"],
    });
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("preserves per-game metrics on the standing rows", () => {
    const matches = [m("a", "b", 20, 10), m("a", "c", 18, 12)];
    const rows = rankGroup({
      playerIds: ["a", "b", "c"],
      matches,
      seedInputs: ["t"],
    });
    const a = rows.find((r) => r.playerId === "a")!;
    expect(a.winRate).toBe(1);
    expect(a.ptsPerGame).toBe(19);
  });
});
