import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function findNullPlayerEntries() {
  const { db } = await import('../app/lib/db/index.js');
  const { rosterEntries, participants } = await import('../app/lib/db/schema.js');
  const { eq, isNull } = await import('drizzle-orm');

  console.log('Finding roster entries with NULL player IDs...\n');

  // Get roster entries with NULL player IDs
  const nullEntries = await db
    .select({
      id: rosterEntries.id,
      participantId: rosterEntries.participantId,
      playerId: rosterEntries.playerId,
      week: rosterEntries.week,
      seasonId: rosterEntries.seasonId,
      fantasyPoints: rosterEntries.fantasyPoints,
    })
    .from(rosterEntries)
    .where(isNull(rosterEntries.playerId));

  console.log(`Found ${nullEntries.length} roster entries with NULL player IDs:\n`);

  for (const entry of nullEntries) {
    // Get participant name
    const participant = await db
      .select({ name: participants.name })
      .from(participants)
      .where(eq(participants.id, entry.participantId))
      .limit(1);

    console.log(`Entry ID: ${entry.id}`);
    console.log(`  Participant: ${participant[0]?.name || 'Unknown'} (ID: ${entry.participantId})`);
    console.log(`  Week: ${entry.week}`);
    console.log(`  Season: ${entry.seasonId}`);
    console.log(`  Fantasy Points: ${entry.fantasyPoints || 0}`);
    console.log('');
  }

  if (nullEntries.length > 0) {
    console.log('\n⚠️  These entries should probably be deleted or have a valid player ID assigned.');
  }
}

findNullPlayerEntries().catch(console.error);
