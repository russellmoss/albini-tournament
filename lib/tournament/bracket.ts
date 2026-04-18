import type { Qualifier } from "./wildcards";
import { seededRng } from "./random";

export type Seed = {
  seed: number;
  playerId: string;
  qualifier: Qualifier;
};

export type BracketSlotPhase = "qf" | "sf" | "final";

export type BracketSlot = {
  slot: number;
  phase: BracketSlotPhase;
  playerAId: string | null;
  playerBId: string | null;
};

export type SeedBracketInput = {
  qualifiers: readonly Qualifier[];
  seedInputs: readonly string[];
};

export type SeedBracketResult = {
  seeds: Seed[];
  slots: BracketSlot[];
};

export const BRACKET_SIZE = 8;

export function seedBracket(input: SeedBracketInput): SeedBracketResult {
  const { qualifiers, seedInputs } = input;

  if (qualifiers.length !== BRACKET_SIZE) {
    throw new Error(
      `Expected ${BRACKET_SIZE} qualifiers, got ${qualifiers.length}`,
    );
  }

  const seen = new Set(qualifiers.map((q) => q.playerId));
  if (seen.size !== qualifiers.length) {
    throw new Error("qualifiers contain duplicate playerIds");
  }

  const rng = seededRng(seedInputs);

  const sorted = [...qualifiers].sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.ptsPerGame !== a.ptsPerGame) return b.ptsPerGame - a.ptsPerGame;
    if (b.diffPerGame !== a.diffPerGame) return b.diffPerGame - a.diffPerGame;
    return 0;
  });

  const seeds: Seed[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].winRate === sorted[i].winRate &&
      sorted[j].ptsPerGame === sorted[i].ptsPerGame &&
      sorted[j].diffPerGame === sorted[i].diffPerGame
    ) {
      j += 1;
    }
    const bucket = sorted.slice(i, j);
    if (bucket.length === 1) {
      seeds.push({ seed: seeds.length + 1, playerId: bucket[0].playerId, qualifier: bucket[0] });
    } else {
      const shuffled = [...bucket].sort((a, b) =>
        a.playerId.localeCompare(b.playerId),
      );
      for (let k = shuffled.length - 1; k > 0; k--) {
        const idx = Math.floor(rng() * (k + 1));
        [shuffled[k], shuffled[idx]] = [shuffled[idx], shuffled[k]];
      }
      for (const q of shuffled) {
        seeds.push({ seed: seeds.length + 1, playerId: q.playerId, qualifier: q });
      }
    }
    i = j;
  }

  const bySeed = new Map(seeds.map((s) => [s.seed, s]));
  const pair = (a: number, b: number) => ({
    a: bySeed.get(a)!.playerId,
    b: bySeed.get(b)!.playerId,
  });

  const qf1 = pair(1, 8);
  const qf2 = pair(4, 5);
  const qf3 = pair(3, 6);
  const qf4 = pair(2, 7);

  const slots: BracketSlot[] = [
    { slot: 1, phase: "qf", playerAId: qf1.a, playerBId: qf1.b },
    { slot: 2, phase: "qf", playerAId: qf2.a, playerBId: qf2.b },
    { slot: 3, phase: "qf", playerAId: qf3.a, playerBId: qf3.b },
    { slot: 4, phase: "qf", playerAId: qf4.a, playerBId: qf4.b },
    { slot: 5, phase: "sf", playerAId: null, playerBId: null },
    { slot: 6, phase: "sf", playerAId: null, playerBId: null },
    { slot: 7, phase: "final", playerAId: null, playerBId: null },
  ];

  return { seeds, slots };
}

export function downstreamSlot(
  qfSlot: number,
): { slot: number; side: "a" | "b" } | null {
  if (qfSlot === 1) return { slot: 5, side: "a" };
  if (qfSlot === 2) return { slot: 5, side: "b" };
  if (qfSlot === 3) return { slot: 6, side: "a" };
  if (qfSlot === 4) return { slot: 6, side: "b" };
  if (qfSlot === 5) return { slot: 7, side: "a" };
  if (qfSlot === 6) return { slot: 7, side: "b" };
  return null;
}
