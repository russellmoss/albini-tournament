import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  boolean,
  smallint,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export type TournamentStatus =
  | "draft"
  | "locked"
  | "group_play"
  | "knockout"
  | "done";

export type TournamentConfig = {
  group_count: number;
  group_size: number;
  advance_top: number;
  wildcard_count: number;
};

export type MatchPhase = "group" | "qf" | "sf" | "final";
export type MatchStatus = "pending" | "done";

export const tournaments = pgTable("tournaments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  status: text("status").$type<TournamentStatus>().notNull().default("draft"),
  config: jsonb("config").$type<TournamentConfig>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (t) => ({
    uniqueTournamentName: uniqueIndex("players_tournament_name_idx").on(
      t.tournamentId,
      t.name,
    ),
    byTournament: index("players_tournament_idx").on(t.tournamentId),
  }),
);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: smallint("position").notNull(),
  },
  (t) => ({
    uniquePosition: uniqueIndex("groups_tournament_position_idx").on(
      t.tournamentId,
      t.position,
    ),
  }),
);

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export const groupAssignments = pgTable(
  "group_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
  },
  (t) => ({
    uniqueGroupPlayer: uniqueIndex("group_assignments_group_player_idx").on(
      t.groupId,
      t.playerId,
    ),
    uniquePlayer: uniqueIndex("group_assignments_player_idx").on(t.playerId),
  }),
);

export type GroupAssignment = typeof groupAssignments.$inferSelect;
export type NewGroupAssignment = typeof groupAssignments.$inferInsert;

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    phase: text("phase").$type<MatchPhase>().notNull(),
    groupId: uuid("group_id").references(() => groups.id, {
      onDelete: "cascade",
    }),
    bracketSlot: smallint("bracket_slot"),
    playerAId: uuid("player_a_id").references(() => players.id),
    playerBId: uuid("player_b_id").references(() => players.id),
    status: text("status").$type<MatchStatus>().notNull().default("pending"),
    wentToSuddenDeath: boolean("went_to_sudden_death").notNull().default(false),
    playedAt: timestamp("played_at", { withTimezone: true }),
  },
  (t) => ({
    byTournamentPhase: index("matches_tournament_phase_idx").on(
      t.tournamentId,
      t.phase,
    ),
  }),
);

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

export const matchResults = pgTable(
  "match_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    points: smallint("points").notNull(),
    won: boolean("won").notNull(),
    forfeit: boolean("forfeit").notNull().default(false),
  },
  (t) => ({
    uniqueMatchPlayer: uniqueIndex("match_results_match_player_idx").on(
      t.matchId,
      t.playerId,
    ),
  }),
);

export type MatchResult = typeof matchResults.$inferSelect;
export type NewMatchResult = typeof matchResults.$inferInsert;

export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ip: text("ip").notNull(),
    attemptAt: timestamp("attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    succeeded: boolean("succeeded").notNull().default(false),
  },
  (t) => ({
    byIpTime: index("auth_attempts_ip_time_idx").on(t.ip, t.attemptAt),
  }),
);

export type AuthAttempt = typeof authAttempts.$inferSelect;
export type NewAuthAttempt = typeof authAttempts.$inferInsert;
