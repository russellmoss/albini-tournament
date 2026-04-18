import { seededRng } from "./random";

export type HeadToHeadMatch = {
  playerAId: string;
  playerBId: string;
  playerAPoints: number;
  playerBPoints: number;
};

export type PlayerStats = {
  playerId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsScored: number;
  pointsAgainst: number;
  pointDiff: number;
  winRate: number;
  ptsPerGame: number;
  diffPerGame: number;
};

export type TiebreakReason = "h2h" | "sub-table" | "coin-flip" | "none";

export type StandingRow = PlayerStats & {
  rank: number;
  tiebreak: TiebreakReason;
};

export function computeStats(
  playerIds: readonly string[],
  matches: readonly HeadToHeadMatch[],
): PlayerStats[] {
  const base = new Map<string, PlayerStats>();
  for (const id of playerIds) {
    base.set(id, {
      playerId: id,
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
  }

  for (const m of matches) {
    const a = base.get(m.playerAId);
    const b = base.get(m.playerBId);
    if (!a || !b) continue;
    a.gamesPlayed += 1;
    b.gamesPlayed += 1;
    a.pointsScored += m.playerAPoints;
    a.pointsAgainst += m.playerBPoints;
    b.pointsScored += m.playerBPoints;
    b.pointsAgainst += m.playerAPoints;
    if (m.playerAPoints > m.playerBPoints) {
      a.wins += 1;
      b.losses += 1;
    } else if (m.playerBPoints > m.playerAPoints) {
      b.wins += 1;
      a.losses += 1;
    }
  }

  for (const s of base.values()) {
    s.pointDiff = s.pointsScored - s.pointsAgainst;
    s.winRate = s.gamesPlayed === 0 ? 0 : s.wins / s.gamesPlayed;
    s.ptsPerGame = s.gamesPlayed === 0 ? 0 : s.pointsScored / s.gamesPlayed;
    s.diffPerGame = s.gamesPlayed === 0 ? 0 : s.pointDiff / s.gamesPlayed;
  }

  return Array.from(base.values());
}

function groupByKey<T>(items: T[], key: (t: T) => string): T[][] {
  const groups: T[][] = [];
  let last: string | null = null;
  for (const it of items) {
    const k = key(it);
    if (k === last && groups.length > 0) {
      groups[groups.length - 1].push(it);
    } else {
      groups.push([it]);
      last = k;
    }
  }
  return groups;
}

function breakWithRng(
  tied: PlayerStats[],
  rng: () => number,
): Array<PlayerStats & { tiebreak: TiebreakReason }> {
  const sorted = [...tied].sort((a, b) =>
    a.playerId.localeCompare(b.playerId),
  );
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }
  return sorted.map((s) => ({ ...s, tiebreak: "coin-flip" as const }));
}

function resolveTwoWayTie(
  tied: PlayerStats[],
  matches: readonly HeadToHeadMatch[],
  rng: () => number,
): Array<PlayerStats & { tiebreak: TiebreakReason }> {
  const [x, y] = tied;
  const direct = matches.find(
    (m) =>
      (m.playerAId === x.playerId && m.playerBId === y.playerId) ||
      (m.playerAId === y.playerId && m.playerBId === x.playerId),
  );

  if (!direct) return breakWithRng(tied, rng);

  const diffForX =
    direct.playerAId === x.playerId
      ? direct.playerAPoints - direct.playerBPoints
      : direct.playerBPoints - direct.playerAPoints;

  if (diffForX === 0) return breakWithRng(tied, rng);

  if (diffForX > 0) return [
    { ...x, tiebreak: "h2h" },
    { ...y, tiebreak: "h2h" },
  ];

  return [
    { ...y, tiebreak: "h2h" },
    { ...x, tiebreak: "h2h" },
  ];
}

function resolveMultiWayTie(
  tied: PlayerStats[],
  matches: readonly HeadToHeadMatch[],
  rng: () => number,
): Array<PlayerStats & { tiebreak: TiebreakReason }> {
  const ids = new Set(tied.map((t) => t.playerId));
  const subMatches = matches.filter(
    (m) => ids.has(m.playerAId) && ids.has(m.playerBId),
  );
  const subStats = computeStats(Array.from(ids), subMatches);

  const sorted = [...subStats].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointsScored !== a.pointsScored) return b.pointsScored - a.pointsScored;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return 0;
  });

  const out: Array<PlayerStats & { tiebreak: TiebreakReason }> = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].wins === sorted[i].wins &&
      sorted[j].pointsScored === sorted[i].pointsScored &&
      sorted[j].pointDiff === sorted[i].pointDiff
    ) {
      j += 1;
    }
    const bucketIds = sorted.slice(i, j).map((s) => s.playerId);
    const originals = bucketIds.map((id) => tied.find((t) => t.playerId === id)!);
    if (originals.length === 1) {
      out.push({ ...originals[0], tiebreak: "sub-table" });
    } else {
      out.push(...breakWithRng(originals, rng));
    }
    i = j;
  }
  return out;
}

export type RankOptions = {
  playerIds: readonly string[];
  matches: readonly HeadToHeadMatch[];
  seedInputs: readonly string[];
};

export function rankGroup(opts: RankOptions): StandingRow[] {
  const { playerIds, matches, seedInputs } = opts;
  const stats = computeStats(playerIds, matches);
  const rng = seededRng(seedInputs);

  const primarySorted = [...stats].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointsScored !== a.pointsScored) return b.pointsScored - a.pointsScored;
    return 0;
  });

  const buckets = groupByKey(
    primarySorted,
    (s) => `${s.wins}:${s.pointsScored}`,
  );

  const resolved: Array<PlayerStats & { tiebreak: TiebreakReason }> = [];
  for (const bucket of buckets) {
    if (bucket.length === 1) {
      resolved.push({ ...bucket[0], tiebreak: "none" });
      continue;
    }
    if (bucket.length === 2) {
      resolved.push(...resolveTwoWayTie(bucket, matches, rng));
      continue;
    }
    resolved.push(...resolveMultiWayTie(bucket, matches, rng));
  }

  return resolved.map((r, i) => ({ ...r, rank: i + 1 }));
}
