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
  hidePicksUntilLock: boolean('hide_picks_until_lock').default(true).notNull(),
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
  homeScore: integer('home_score'), // Final home team score
  awayScore: integer('away_score'), // Final away team score
  status: text('status'), // Game status from ESPN (e.g., 'STATUS_IN_PROGRESS', 'STATUS_FINAL')
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
  fantasyPoints: real('fantasy_points'), // Calculated fantasy points for this entry
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Player game stats - stats for each player in each game
export const playerGameStats = ampPlayoffsSchema.table('player_game_stats', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id')
    .references(() => players.id, { onDelete: 'cascade' }),
  espnPlayerId: text('espn_player_id'), // ESPN player ID
  gameId: integer('game_id')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  seasonId: integer('season_id')
    .notNull()
    .references(() => seasons.id, { onDelete: 'cascade' }),
  week: integer('week').notNull(),
  // Passing stats
  passingYards: integer('passing_yards').default(0),
  passingTDs: integer('passing_tds').default(0),
  passing2PtConversions: integer('passing_2pt_conversions').default(0),
  // Rushing stats
  rushingYards: integer('rushing_yards').default(0),
  rushingTDs: integer('rushing_tds').default(0),
  rushing2PtConversions: integer('rushing_2pt_conversions').default(0),
  // Receiving stats
  receivingYards: integer('receiving_yards').default(0),
  receivingTDs: integer('receiving_tds').default(0),
  receiving2PtConversions: integer('receiving_2pt_conversions').default(0),
  // Calculated points
  fantasyPoints: real('fantasy_points').default(0),
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
