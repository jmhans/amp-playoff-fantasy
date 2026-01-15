import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Helper function to calculate yardage points (handles negatives correctly)
function calculateYardagePoints(yards: number, divisor: number): number {
  if (yards >= 0) {
    return Math.floor(yards / divisor);
  } else {
    // For negative yards: -1 to -9 = 0, -10 to -19 = -1, etc.
    return Math.ceil(yards / divisor);
  }
}

// Scoring rules
function calculateFantasyPoints(stats: {
  passingYards: number;
  passingTDs: number;
  passing2PtConversions: number;
  rushingYards: number;
  rushingTDs: number;
  rushing2PtConversions: number;
  receivingYards: number;
  receivingTDs: number;
  receiving2PtConversions: number;
}): number {
  let points = 0;
  
  // Passing: 1 pt per 25 yards (no fractional), 4 pts per TD, 1 pt per 2pt conversion
  points += calculateYardagePoints(stats.passingYards, 25);
  points += stats.passingTDs * 4;
  points += stats.passing2PtConversions * 1;
  
  // Rushing: 1 pt per 10 yards (no fractional), 6 pts per TD, 2 pts per 2pt conversion
  points += calculateYardagePoints(stats.rushingYards, 10);
  points += stats.rushingTDs * 6;
  points += stats.rushing2PtConversions * 2;
  
  // Receiving: 1 pt per 10 yards (no fractional), 6 pts per TD, 2 pts per 2pt conversion
  points += calculateYardagePoints(stats.receivingYards, 10);
  points += stats.receivingTDs * 6;
  points += stats.receiving2PtConversions * 2;
  
  return points;
}

async function fixOmarionHampton() {
  const { db } = await import('../app/lib/db/index.js');
  const { players, playerGameStats, rosterEntries } = await import('../app/lib/db/schema.js');
  const { eq, and } = await import('drizzle-orm');

  console.log('Finding Omarion Hampton...\n');

  // Find the player
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.name, 'Omarion Hampton'))
    .limit(1);

  if (!player) {
    console.log('❌ Omarion Hampton not found in players table');
    return;
  }

  console.log(`✅ Found player: ${player.name} (ID: ${player.id})`);
  console.log(`   Position: ${player.position}, Team: ${player.team}\n`);

  // Get his week 1 stats
  const [stats] = await db
    .select()
    .from(playerGameStats)
    .where(and(
      eq(playerGameStats.playerId, player.id),
      eq(playerGameStats.week, 1)
    ))
    .limit(1);

  if (!stats) {
    console.log('❌ No week 1 stats found');
    return;
  }

  console.log('Current stats:');
  console.log(`  Passing: ${stats.passingYards} yds, ${stats.passingTDs} TDs, ${stats.passing2PtConversions} 2pts`);
  console.log(`  Rushing: ${stats.rushingYards} yds, ${stats.rushingTDs} TDs, ${stats.rushing2PtConversions} 2pts`);
  console.log(`  Receiving: ${stats.receivingYards} yds, ${stats.receivingTDs} TDs, ${stats.receiving2PtConversions} 2pts`);
  console.log(`  Current Fantasy Points: ${stats.fantasyPoints}\n`);

  // Recalculate with correct formula
  const correctPoints = calculateFantasyPoints({
    passingYards: stats.passingYards || 0,
    passingTDs: stats.passingTDs || 0,
    passing2PtConversions: stats.passing2PtConversions || 0,
    rushingYards: stats.rushingYards || 0,
    rushingTDs: stats.rushingTDs || 0,
    rushing2PtConversions: stats.rushing2PtConversions || 0,
    receivingYards: stats.receivingYards || 0,
    receivingTDs: stats.receivingTDs || 0,
    receiving2PtConversions: stats.receiving2PtConversions || 0,
  });

  console.log(`Recalculated Fantasy Points: ${correctPoints}`);

  if (correctPoints === stats.fantasyPoints) {
    console.log('✅ Points are already correct, no update needed');
    return;
  }

  console.log(`\n📝 Updating fantasy points from ${stats.fantasyPoints} to ${correctPoints}...\n`);

  // Update playerGameStats
  await db
    .update(playerGameStats)
    .set({ fantasyPoints: correctPoints })
    .where(eq(playerGameStats.id, stats.id));

  console.log('✅ Updated playerGameStats table');

  // Get all roster entries for this player in week 1
  const entries = await db
    .select()
    .from(rosterEntries)
    .where(and(
      eq(rosterEntries.playerId, player.id),
      eq(rosterEntries.week, 1)
    ));

  console.log(`\n📋 Found ${entries.length} roster entries to update:`);

  // Update each roster entry
  for (const entry of entries) {
    await db
      .update(rosterEntries)
      .set({ fantasyPoints: correctPoints })
      .where(eq(rosterEntries.id, entry.id));
    
    console.log(`   ✅ Updated roster entry ${entry.id} (Participant ${entry.participantId})`);
  }

  console.log(`\n✅ Complete! Updated ${entries.length} roster entries and 1 player stat record.`);
}

fixOmarionHampton().catch(console.error);
