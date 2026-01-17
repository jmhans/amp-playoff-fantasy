-- Add system_settings table for tracking metadata
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'ampplayoffs' 
    AND table_name = 'system_settings'
  ) THEN
    CREATE TABLE "ampplayoffs"."system_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" text NOT NULL,
      "value" text,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "system_settings_key_unique" UNIQUE("key")
    );
  END IF;
END $$;
