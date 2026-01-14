import { config } from 'dotenv';
import { resolve } from 'path';

async function checkJoshAllen() {
  // Load environment variables FIRST
  const result = config({ path: resolve(process.cwd(), '.env.local') });
  
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL not found in environment variables');
    process.exit(1);
  }

  // Then dynamic import inside async function
  const { db } = await import('../app/lib/db/index.js');
  const { players, rosterEntries, playerGameStats } = await import('../app/lib/db/schema.js');
  const { eq } = await import('drizzle-orm');

  console.log('Checking Josh Allen stats...\n');
  
  // Find Josh Allen
  const [player] = await db.select().from(players).where(eq(players.name, 'Josh Allen')).limit(1);
  
  if (!player) {
    console.log('Josh Allen not found');
    return;
  }
  
  console.log(`Found player: ${player.name} (ID: ${player.id})`);
  console.log(`Position: ${player.position}, Team: ${player.team}\n`);
  
  // Get all his week 1 roster entries
  const entries = await db.select().from(rosterEntries).where(eq(rosterEntries.playerId, player.id));
  const week1Entries = entries.filter(e => e.week === 1);
  
  console.log(`Week 1 roster entries: ${week1Entries.length}`);
  
  if (week1Entries.length > 0) {
    const sample = week1Entries[0];
    console.log('\nSample week 1 roster entry:');
    console.log(`- Fantasy Points: ${sample.fantasyPoints}`);
  }
  
  // Get his game stats
  const gameStats = await db.select().from(playerGameStats).where(eq(playerGameStats.playerId, player.id));
  const week1Stats = gameStats.filter(s => s.week === 1);
  
  console.log(`\nWeek 1 game stats records: ${week1Stats.length}`);
  
  if (week1Stats.length > 0) {
    const stats = week1Stats[0];
    console.log('\nWeek 1 game stats:');
    console.log(`- Passing Yards: ${stats.passingYards}`);
    console.log(`- Passing TDs: ${stats.passingTDs}`);
    console.log(`- Rushing Yards: ${stats.rushingYards}`);
    console.log(`- Rushing TDs: ${stats.rushingTDs}`);
    console.log(`- Receiving Yards: ${stats.receivingYards}`);
    console.log(`- Receiving TDs: ${stats.receivingTDs}`);
  }
}

checkJoshAllen();
