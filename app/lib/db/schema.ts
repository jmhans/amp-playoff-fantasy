import { pgSchema, serial, text, integer, timestamp, boolean, real, json } from 'drizzle-orm/pg-core';

// Create a custom schema
export const ampPlayoffsSchema = pgSchema('ampplayoffs');

// Players table
export const players = ampPlayoffsSchema.table('players', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  position: text('position').notNull(),
  team: text('team').notNull(),
  espnId: text('espn_id').unique(),
  sleeperId: text('sleeper_id').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Participants table
export const participants = ampPlayoffsSchema.table('participants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  auth0Id: text('auth0_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Seasons table
export const seasons = ampPlayoffsSchema.table('seasons', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull().unique(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Games table - playoff games with spreads
export const games = ampPlayoffsSchema.table('games', {
  id: serial('id').primaryKey(),
  seasonId: integer('season_id')
    .notNull()
    .references(() => seasons.id, { onDelete: 'cascade' }),
  week: integer('week').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  spread: real('spread'), // Spread applied to home team (positive = home favored)
  espnGameId: text('espn_game_id').unique(),
  gameTime: timestamp('game_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Roster entries - each participant picks players for each position/week combination
export const rosterEntries = ampPlayoffsSchema.table('roster_entries', {
  id: serial('id').primaryKey(),
  participantId: integer('participant_id')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  seasonId: integer('season_id')
    .notNull()
    .references(() => seasons.id, { onDelete: 'cascade' }),
  playerId: integer('player_id')
    .references(() => players.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  position: text('position').notNull(),
  week: integer('week').notNull(),
  team: text('team'),
  gameId: integer('game_id')
    .references(() => games.id, { onDelete: 'cascade' }),
  pickedTeam: text('picked_team'), // For TEAM position: which team was picked (home or away)
  pickedSpread: real('picked_spread'), // The spread at time of pick (positive = team favored)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Weekly scores
export const weeklyScores = ampPlayoffsSchema.table('weekly_scores', {
  id: serial('id').primaryKey(),
  rosterEntryId: integer('roster_entry_id')
    .notNull()
    .references(() => rosterEntries.id, { onDelete: 'cascade' }),
  week: integer('week').notNull(),
  points: real('points').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Weekly actuals (from ESPN/Sleeper)
export const weeklyActuals = ampPlayoffsSchema.table('weekly_actuals', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  espnId: text('espn_id').notNull(),
  season: integer('season').notNull(),
  week: integer('week').notNull(),
  fantasyPoints: real('fantasy_points').notNull(),
  stats: json('stats'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
