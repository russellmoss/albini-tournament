import { describe, it, expect } from "vitest";
import { drawGroups, ALBINI_RECORDS } from "./draw";

const makeIds = (n: number, prefix = "p") =>
  Array.from({ length: n }, (_, i) => `${prefix}-${String(i).padStart(2, "0")}`);

describe("drawGroups", () => {
  it("assigns all players across the requested groups", () => {
    const playerIds = makeIds(15);
    const result = drawGroups({
      tournamentId: "t-abc",
      playerIds,
      groupCount: 3,
      groupSize: 5,
    });

    expect(result.groups).toHaveLength(3);
    const assigned = result.groups.flatMap((g) => g.playerIds);
    expect(assigned).toHaveLength(15);
    expect(new Set(assigned).size).toBe(15);
  });

  it("places groupSize players in each group", () => {
    const result = drawGroups({
      tournamentId: "t-abc",
      playerIds: makeIds(15),
      groupCount: 3,
      groupSize: 5,
    });
    for (const g of result.groups) {
      expect(g.playerIds).toHaveLength(5);
    }
  });

  it("generates C(groupSize, 2) matches per group", () => {
    const result = drawGroups({
      tournamentId: "t-abc",
      playerIds: makeIds(15),
      groupCount: 3,
      groupSize: 5,
    });
    expect(result.matches).toHaveLength(30);
    for (let pos = 1; pos <= 3; pos++) {
      const inGroup = result.matches.filter((m) => m.groupPosition === pos);
      expect(inGroup).toHaveLength(10);
    }
  });

  it("never pairs a player against themselves or duplicates a pairing", () => {
    const result = drawGroups({
      tournamentId: "t-abc",
      playerIds: makeIds(15),
      groupCount: 3,
      groupSize: 5,
    });
    for (const m of result.matches) {
      expect(m.playerAId).not.toBe(m.playerBId);
    }
    const seen = new Set<string>();
    for (const m of result.matches) {
      const key = [m.playerAId, m.playerBId].sort().join("|");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("picks group names from the curated Albini records list", () => {
    const result = drawGroups({
      tournamentId: "t-abc",
      playerIds: makeIds(15),
      groupCount: 3,
      groupSize: 5,
    });
    const names = result.groups.map((g) => g.name);
    expect(new Set(names).size).toBe(3);
    for (const n of names) {
      expect(ALBINI_RECORDS).toContain(n);
    }
  });

  it("is deterministic for a fixed tournament id and player set", () => {
    const input = {
      tournamentId: "t-abc",
      playerIds: makeIds(15),
      groupCount: 3,
      groupSize: 5,
    };
    const a = drawGroups(input);
    const b = drawGroups(input);
    expect(a).toEqual(b);
  });

  it("is order-independent w.r.t. input playerIds order", () => {
    const ids = makeIds(15);
    const a = drawGroups({
      tournamentId: "t-abc",
      playerIds: ids,
      groupCount: 3,
      groupSize: 5,
    });
    const b = drawGroups({
      tournamentId: "t-abc",
      playerIds: [...ids].reverse(),
      groupCount: 3,
      groupSize: 5,
    });
    expect(new Set(a.groups.map((g) => g.playerIds.sort().join("|")))).toEqual(
      new Set(b.groups.map((g) => g.playerIds.sort().join("|"))),
    );
  });

  it("differs between tournaments", () => {
    const ids = makeIds(15);
    const a = drawGroups({ tournamentId: "t-abc", playerIds: ids, groupCount: 3, groupSize: 5 });
    const b = drawGroups({ tournamentId: "t-xyz", playerIds: ids, groupCount: 3, groupSize: 5 });
    expect(a).not.toEqual(b);
  });

  it("rejects wrong player count", () => {
    expect(() =>
      drawGroups({
        tournamentId: "t-abc",
        playerIds: makeIds(14),
        groupCount: 3,
        groupSize: 5,
      }),
    ).toThrow(/15 players/);
  });

  it("rejects duplicate player ids", () => {
    const dupes = [...makeIds(14), "p-00"];
    expect(() =>
      drawGroups({
        tournamentId: "t-abc",
        playerIds: dupes,
        groupCount: 3,
        groupSize: 5,
      }),
    ).toThrow(/duplicates/);
  });

  it("rejects unworkable sizes", () => {
    expect(() =>
      drawGroups({
        tournamentId: "t",
        playerIds: makeIds(0),
        groupCount: 0,
        groupSize: 5,
      }),
    ).toThrow(/groupCount/);
    expect(() =>
      drawGroups({
        tournamentId: "t",
        playerIds: makeIds(3),
        groupCount: 3,
        groupSize: 1,
      }),
    ).toThrow(/groupSize/);
  });

  it("rejects groupCount greater than the curated record list", () => {
    expect(() =>
      drawGroups({
        tournamentId: "t",
        playerIds: makeIds(200),
        groupCount: 100,
        groupSize: 2,
      }),
    ).toThrow(/records available/);
  });

  it("assigns positions 1..groupCount to the groups in order", () => {
    const result = drawGroups({
      tournamentId: "t-abc",
      playerIds: makeIds(15),
      groupCount: 3,
      groupSize: 5,
    });
    expect(result.groups.map((g) => g.position)).toEqual([1, 2, 3]);
  });
});
