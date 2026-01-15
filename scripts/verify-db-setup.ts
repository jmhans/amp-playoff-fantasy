import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying Database Configuration\n');
  console.log('━'.repeat(50));

  // Check environment variables
  const hasProdUrl = !!process.env.POSTGRES_URL;
  const hasDevUrl = !!process.env.POSTGRES_URL_DEV;

  console.log('\n📋 Environment Variables:');
  console.log(`  POSTGRES_URL (prod):     ${hasProdUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  POSTGRES_URL_DEV (dev):  ${hasDevUrl ? '✅ Set' : '❌ Missing'}`);

  if (hasProdUrl) {
    const prodUrl = process.env.POSTGRES_URL!;
    const prodMatch = prodUrl.match(/ep-[a-z0-9-]+/);
    console.log(`  Production endpoint:     ${prodMatch ? prodMatch[0] : 'unknown'}`);
  }

  if (hasDevUrl) {
    const devUrl = process.env.POSTGRES_URL_DEV!;
    const devMatch = devUrl.match(/ep-[a-z0-9-]+/);
    console.log(`  Development endpoint:    ${devMatch ? devMatch[0] : 'unknown'}`);
  }

  // Determine which database will be used
  const dbUrl = hasDevUrl ? process.env.POSTGRES_URL_DEV : process.env.POSTGRES_URL;
  const usingDev = hasDevUrl;

  console.log('\n🎯 Active Database:');
  console.log(`  Currently using:         ${usingDev ? '🟢 DEV branch' : '🔴 PRODUCTION'}`);

  if (!usingDev && hasProdUrl) {
    console.log('\n  ⚠️  WARNING: You are connected to PRODUCTION!');
    console.log('  Set POSTGRES_URL_DEV in .env.local to use dev branch.');
  }

  // Test connection
  console.log('\n🔌 Testing Connection...');
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(dbUrl!);
    
    const result = await sql`SELECT current_database(), current_user, version()`;
    
    console.log('  ✅ Connection successful!');
    console.log(`  Database:  ${result[0].current_database}`);
    console.log(`  User:      ${result[0].current_user}`);
    console.log(`  Version:   ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);

    // Check if ampplayoffs schema exists
    const schemaCheck = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'ampplayoffs'
    `;

    if (schemaCheck.length > 0) {
      console.log('  ✅ ampplayoffs schema found');
      
      // Count tables in schema
      const tableCount = await sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'ampplayoffs'
      `;
      console.log(`  Tables:    ${tableCount[0].count} tables in ampplayoffs schema`);
    } else {
      console.log('  ⚠️  ampplayoffs schema not found - may need to run migrations');
    }

  } catch (error: any) {
    console.log('  ❌ Connection failed!');
    console.log(`  Error: ${error.message}`);
  }

  console.log('\n━'.repeat(50));
  console.log('\n💡 Next Steps:');
  
  if (!hasDevUrl) {
    console.log('  1. Create a dev branch in Neon Console');
    console.log('  2. Copy the dev branch connection string');
    console.log('  3. Add POSTGRES_URL_DEV to .env.local');
    console.log('  4. Run this script again to verify');
  } else {
    console.log('  ✅ Setup complete! You can now:');
    console.log('     - Make schema changes');
    console.log('     - Run: npm run db:generate');
    console.log('     - Run: npm run db:migrate');
    console.log('     - Changes will apply to dev branch only');
  }
  
  console.log('\n📖 See DATABASE_BRANCHING.md for detailed instructions\n');
}

verifyDatabaseSetup().catch(console.error);
