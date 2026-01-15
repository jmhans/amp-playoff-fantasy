CREATE SCHEMA IF NOT EXISTS "ampplayoffs";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ampplayoffs"."games" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"week" integer NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"spread" real,
	"espn_game_id" text,
	"game_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "games_espn_game_id_unique" UNIQUE("espn_game_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ampplayoffs"."participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"auth0_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ampplayoffs"."players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"team" text NOT NULL,
	"espn_id" text,
	"sleeper_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "players_espn_id_unique" UNIQUE("espn_id"),
	CONSTRAINT "players_sleeper_id_unique" UNIQUE("sleeper_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ampplayoffs"."roster_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"player_id" integer,
	"player_name" text NOT NULL,
	"position" text NOT NULL,
	"week" integer NOT NULL,
	"team" text,
	"game_id" integer,
	"picked_team" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ampplayoffs"."seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seasons_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ampplayoffs"."weekly_actuals" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"espn_id" text NOT NULL,
	"season" integer NOT NULL,
	"week" integer NOT NULL,
	"fantasy_points" real NOT NULL,
	"stats" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ampplayoffs"."weekly_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"roster_entry_id" integer NOT NULL,
	"week" integer NOT NULL,
	"points" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ampplayoffs"."games" ADD CONSTRAINT "games_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "ampplayoffs"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ampplayoffs"."roster_entries" ADD CONSTRAINT "roster_entries_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "ampplayoffs"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ampplayoffs"."roster_entries" ADD CONSTRAINT "roster_entries_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "ampplayoffs"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ampplayoffs"."roster_entries" ADD CONSTRAINT "roster_entries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "ampplayoffs"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ampplayoffs"."roster_entries" ADD CONSTRAINT "roster_entries_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "ampplayoffs"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ampplayoffs"."weekly_actuals" ADD CONSTRAINT "weekly_actuals_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "ampplayoffs"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ampplayoffs"."weekly_scores" ADD CONSTRAINT "weekly_scores_roster_entry_id_roster_entries_id_fk" FOREIGN KEY ("roster_entry_id") REFERENCES "ampplayoffs"."roster_entries"("id") ON DELETE cascade ON UPDATE no action;