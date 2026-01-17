-- Add hide_picks_until_lock column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ampplayoffs' 
    AND table_name = 'participants' 
    AND column_name = 'hide_picks_until_lock'
  ) THEN
    ALTER TABLE "ampplayoffs"."participants" ADD COLUMN "hide_picks_until_lock" boolean DEFAULT false NOT NULL;
  END IF;
END $$;
