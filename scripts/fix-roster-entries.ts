import { config } from 'dotenv';
import { resolve } from 'path';
import { eq } from 'drizzle-orm';

// Load environment variables FIRST
const result = config({ path: resolve(process.cwd(), '.env.local') });
if (result.error) {
  console.error('Error loading .env.local:', result.error);
  process.exit(1);
}

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL not found in environment variables');
  process.exit(1);
}

async function fixRosterEntries() {
  console.log('Starting roster entries fix...\n');
  
  // Import db AFTER env vars are loaded
  const { db } = await import('../app/lib/db');
  const { rosterEntries, participants, seasons } = await import('../app/lib/db/schema');
  
  try {
    // Get active season
    const activeSeason = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);
    
    if (!activeSeason[0]) {
      console.error('No active season found');
      return;
    }
    
    const seasonId = activeSeason[0].id;
    console.log(`Active season: ${activeSeason[0].name} (ID: ${seasonId})\n`);
    
    // Get all participants
    const allParticipants = await db.select().from(participants);
    console.log(`Found ${allParticipants.length} participants\n`);
    
    const positions = ['QB', 'RB', 'WR', 'FLEX', 'TEAM'];
    const weeks = [1, 2, 3, 4];
    
    for (const participant of allParticipants) {
      console.log(`Processing ${participant.name}...`);
      
      // Get existing entries for this participant in active season
      const existingEntries = await db
        .select()
        .from(rosterEntries)
        .where(eq(rosterEntries.participantId, participant.id));
      
      console.log(`  Found ${existingEntries.length} existing entries`);
      
      // Check which position/week combinations exist
      const existing = new Set(
        existingEntries
          .filter(e => e.seasonId === seasonId)
          .map(e => `${e.position}-${e.week}`)
      );
      
      let added = 0;
      
      // Add missing entries
      for (const position of positions) {
        for (const week of weeks) {
          const key = `${position}-${week}`;
          if (!existing.has(key)) {
            await db.insert(rosterEntries).values({
              participantId: participant.id,
              seasonId,
              position,
              week,
              playerName: '',
              playerId: null,
              team: null,
            });
            added++;
          }
        }
      }
      
      if (added > 0) {
        console.log(`  ✓ Added ${added} missing entries`);
      } else {
        console.log(`  ✓ All entries present`);
      }
    }
    
    console.log('\n✅ Roster entries fix complete!');
  } catch (error) {
    console.error('Error fixing roster entries:', error);
  }
  
  process.exit(0);
}

fixRosterEntries();
