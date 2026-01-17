-- Add projected_fantasy_points column to players table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ampplayoffs' 
    AND table_name = 'players' 
    AND column_name = 'projected_fantasy_points'
  ) THEN
    ALTER TABLE ampplayoffs.players 
    ADD COLUMN projected_fantasy_points real;
  END IF;
END $$;
