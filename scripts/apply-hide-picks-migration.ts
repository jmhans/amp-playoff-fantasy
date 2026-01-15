import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function applyHidePicksMigration() {
  const { neon } = await import('@neondatabase/serverless');
  
  const dbUrl = process.env.POSTGRES_URL_DEV || process.env.POSTGRES_URL;
  const sql = neon(dbUrl!);

  console.log('Applying hide_picks_until_lock migration...\n');

  try {
    // Check if column already exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'ampplayoffs' 
      AND table_name = 'participants' 
      AND column_name = 'hide_picks_until_lock'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ Column hide_picks_until_lock already exists, skipping migration');
      return;
    }

    // Add the column
    await sql`
      ALTER TABLE "ampplayoffs"."participants" 
      ADD COLUMN "hide_picks_until_lock" boolean DEFAULT false NOT NULL
    `;

    console.log('✅ Successfully added hide_picks_until_lock column to participants table');
    
    // Verify
    const verify = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'ampplayoffs' 
      AND table_name = 'participants' 
      AND column_name = 'hide_picks_until_lock'
    `;

    console.log('\nColumn details:');
    console.log(`  Name: ${verify[0].column_name}`);
    console.log(`  Type: ${verify[0].data_type}`);
    console.log(`  Default: ${verify[0].column_default}`);

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

applyHidePicksMigration().catch(console.error);
