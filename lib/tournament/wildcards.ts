import type { StandingRow } from "./standings";
import { seededRng } from "./random";

export type GroupStanding = {
  groupId: string;
  groupPosition: number;
  standings: readonly StandingRow[];
};

export type QualifierType = "group_winner" | "wildcard";

export type Qualifier = {
  playerId: string;
  sourceGroupPosition: number;
  sourceGroupId: string;
  sourceRank: number;
  qualifierType: QualifierType;
  wins: number;
  gamesPlayed: number;
  pointsScored: number;
  pointDiff: number;
  winRate: number;
  ptsPerGame: number;
  diffPerGame: number;
};

export type SelectQualifiersInput = {
  groups: readonly GroupStanding[];
  advanceTop: number;
  wildcardCount: number;
  seedInputs: readonly string[];
};

export type SelectQualifiersResult = {
  groupWinners: Qualifier[];
  wildcards: Qualifier[];
};

function rowToQualifier(
  row: StandingRow,
  groupPosition: number,
  groupId: string,
  qualifierType: QualifierType,
): Qualifier {
  return {
    playerId: row.playerId,
    sourceGroupPosition: groupPosition,
    sourceGroupId: groupId,
    sourceRank: row.rank,
    qualifierType,
    wins: row.wins,
    gamesPlayed: row.gamesPlayed,
    pointsScored: row.pointsScored,
    pointDiff: row.pointDiff,
    winRate: row.winRate,
    ptsPerGame: row.ptsPerGame,
    diffPerGame: row.diffPerGame,
  };
}

export function selectQualifiers(
  input: SelectQualifiersInput,
): SelectQualifiersResult {
  const { groups, advanceTop, wildcardCount, seedInputs } = input;

  if (advanceTop < 1) throw new Error("advanceTop must be >= 1");
  if (wildcardCount < 0) throw new Error("wildcardCount must be >= 0");
  if (groups.length === 0) throw new Error("groups must not be empty");

  const groupWinners: Qualifier[] = [];
  const candidates: Qualifier[] = [];

  for (const g of groups) {
    const advancing = g.standings.slice(0, advanceTop);
    const remaining = g.standings.slice(advanceTop);
    for (const row of advancing) {
      groupWinners.push(
        rowToQualifier(row, g.groupPosition, g.groupId, "group_winner"),
      );
    }
    for (const row of remaining) {
      candidates.push(
        rowToQualifier(row, g.groupPosition, g.groupId, "wildcard"),
      );
    }
  }

  if (wildcardCount === 0) return { groupWinners, wildcards: [] };
  if (candidates.length < wildcardCount) {
    throw new Error(
      `Need ${wildcardCount} wildcards but only ${candidates.length} candidates available`,
    );
  }

  const rng = seededRng(seedInputs);

  const sorted = [...candidates].sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.ptsPerGame !== a.ptsPerGame) return b.ptsPerGame - a.ptsPerGame;
    if (b.diffPerGame !== a.diffPerGame) return b.diffPerGame - a.diffPerGame;
    return 0;
  });

  const wildcards: Qualifier[] = [];
  let i = 0;
  while (wildcards.length < wildcardCount && i < sorted.length) {
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].winRate === sorted[i].winRate &&
      sorted[j].ptsPerGame === sorted[i].ptsPerGame &&
      sorted[j].diffPerGame === sorted[i].diffPerGame
    ) {
      j += 1;
    }
    const tied = sorted.slice(i, j);
    const slotsLeft = wildcardCount - wildcards.length;
    if (tied.length === 1 || tied.length <= slotsLeft) {
      wildcards.push(...tied.slice(0, slotsLeft));
    } else {
      const shuffled = [...tied].sort((a, b) =>
        a.playerId.localeCompare(b.playerId),
      );
      for (let k = shuffled.length - 1; k > 0; k--) {
        const idx = Math.floor(rng() * (k + 1));
        [shuffled[k], shuffled[idx]] = [shuffled[idx], shuffled[k]];
      }
      wildcards.push(...shuffled.slice(0, slotsLeft));
    }
    i = j;
  }

  return { groupWinners, wildcards };
}
