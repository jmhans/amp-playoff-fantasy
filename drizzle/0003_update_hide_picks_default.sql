-- Migration: Update hide_picks_until_lock default to true and update existing records
-- This ensures all participants have picks hidden by default

-- First, add the column if it doesn't exist (for prod deployment)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ampplayoffs' 
    AND table_name = 'participants' 
    AND column_name = 'hide_picks_until_lock'
  ) THEN
    ALTER TABLE "ampplayoffs"."participants" 
    ADD COLUMN "hide_picks_until_lock" boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Update existing records to true
UPDATE "ampplayoffs"."participants" 
SET "hide_picks_until_lock" = true 
WHERE "hide_picks_until_lock" IS NULL OR "hide_picks_until_lock" = false;

-- Change the default value to true (in case it was created with false)
ALTER TABLE "ampplayoffs"."participants" 
ALTER COLUMN "hide_picks_until_lock" SET DEFAULT true;
