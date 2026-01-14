import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function findMissingPlayers() {
  const { db } = await import('../app/lib/db/index.js');
  const { rosterEntries, players } = await import('../app/lib/db/schema.js');
  const { eq, sql } = await import('drizzle-orm');

  console.log('Finding roster entries without matching players...\n');

  // Get all unique player IDs from roster entries
  const rosteredPlayerIds = await db
    .selectDistinct({ playerId: rosterEntries.playerId })
    .from(rosterEntries);

  console.log(`Found ${rosteredPlayerIds.length} unique player IDs in rosters`);

  // Check which ones don't have player records
  const missingPlayers = [];
  
  for (const { playerId } of rosteredPlayerIds) {
    if (playerId === null) {
      console.log('⚠️  Found roster entry with NULL player ID');
      continue;
    }

    const playerRecord = await db
      .select()
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);

    if (playerRecord.length === 0) {
      missingPlayers.push(playerId);
      
      // Get roster entries for this missing player
      const entries = await db
        .select({
          participantId: rosterEntries.participantId,
          week: rosterEntries.week,
          seasonId: rosterEntries.seasonId,
        })
        .from(rosterEntries)
        .where(eq(rosterEntries.playerId, playerId));

      console.log(`\n❌ Player ID ${playerId} is missing from players table`);
      console.log(`   Used in ${entries.length} roster entries:`);
      entries.forEach(entry => {
        console.log(`   - Participant ${entry.participantId}, Week ${entry.week}, Season ${entry.seasonId}`);
      });
    }
  }

  if (missingPlayers.length === 0) {
    console.log('\n✅ All roster entries have matching player records!');
  } else {
    console.log(`\n\nTotal missing players: ${missingPlayers.length}`);
    console.log('Missing player IDs:', missingPlayers);
  }
}

findMissingPlayers().catch(console.error);
