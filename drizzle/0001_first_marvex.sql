DO $$ BEGIN
 ALTER TABLE "ampplayoffs"."roster_entries" ADD COLUMN "picked_spread" real;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;