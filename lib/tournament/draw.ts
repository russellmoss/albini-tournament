import { seededRng, shuffle } from "./random";

export const ALBINI_RECORDS: readonly string[] = [
  "In Utero",
  "Surfer Rosa",
  "At Action Park",
  "Rid of Me",
  "Pod",
  "Atomizer",
  "The Hammer Party",
  "Songs About Fucking",
  "1000 Hurts",
  "Terraform",
  "Pigpile",
  "Whitechocolatespaceegg",
];

export type DrawInput = {
  tournamentId: string;
  playerIds: readonly string[];
  groupCount: number;
  groupSize: number;
};

export type DrawnGroup = {
  position: number;
  name: string;
  playerIds: string[];
};

export type DrawnMatch = {
  groupPosition: number;
  playerAId: string;
  playerBId: string;
};

export type DrawResult = {
  groups: DrawnGroup[];
  matches: DrawnMatch[];
};

export function drawGroups(input: DrawInput): DrawResult {
  const { tournamentId, playerIds, groupCount, groupSize } = input;

  if (groupCount < 1) throw new Error("groupCount must be >= 1");
  if (groupSize < 2) throw new Error("groupSize must be >= 2");
  if (playerIds.length !== groupCount * groupSize) {
    throw new Error(
      `Expected ${groupCount * groupSize} players (${groupCount}x${groupSize}), got ${playerIds.length}`,
    );
  }
  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error("playerIds contains duplicates");
  }
  if (groupCount > ALBINI_RECORDS.length) {
    throw new Error(
      `Need ${groupCount} group names but only ${ALBINI_RECORDS.length} records available`,
    );
  }

  const rng = seededRng([tournamentId, ...playerIds]);

  const canonicalPlayers = [...playerIds].sort();
  const shuffledPlayers = shuffle(canonicalPlayers, rng);
  const shuffledNames = shuffle(ALBINI_RECORDS, rng).slice(0, groupCount);

  const groups: DrawnGroup[] = Array.from({ length: groupCount }, (_, i) => ({
    position: i + 1,
    name: shuffledNames[i],
    playerIds: [],
  }));

  shuffledPlayers.forEach((playerId, idx) => {
    groups[idx % groupCount].playerIds.push(playerId);
  });

  const matches: DrawnMatch[] = [];
  for (const group of groups) {
    const { playerIds: gpi } = group;
    for (let i = 0; i < gpi.length; i++) {
      for (let j = i + 1; j < gpi.length; j++) {
        matches.push({
          groupPosition: group.position,
          playerAId: gpi[i],
          playerBId: gpi[j],
        });
      }
    }
  }

  return { groups, matches };
}
