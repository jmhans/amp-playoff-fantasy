import { config } from 'dotenv';
import { resolve } from 'path';

async function verifyFantasyPoints() {
  // Load environment variables FIRST
  const result = config({ path: resolve(process.cwd(), '.env.local') });
  
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL not found in environment variables');
    process.exit(1);
  }

  // Then dynamic import inside async function
  const { db } = await import('../app/lib/db/index.js');
  const { players, playerGameStats } = await import('../app/lib/db/schema.js');
  const { eq } = await import('drizzle-orm');

  console.log('Verifying fantasy points calculations...\n');
  
  // Find Josh Allen
  const [player] = await db.select().from(players).where(eq(players.name, 'Josh Allen')).limit(1);
  
  if (!player) {
    console.log('Josh Allen not found');
    return;
  }
  
  const [stats] = await db.select().from(playerGameStats)
    .where(eq(playerGameStats.playerId, player.id))
    .limit(1);
  
  if (!stats) {
    console.log('No stats found');
    return;
  }
  
  console.log(`${player.name} - Week ${stats.week}`);
  console.log('Raw Stats:');
  console.log(`  Passing: ${stats.passingYards} yards, ${stats.passingTDs} TDs, ${stats.passing2PtConversions} 2pts`);
  console.log(`  Rushing: ${stats.rushingYards} yards, ${stats.rushingTDs} TDs, ${stats.rushing2PtConversions} 2pts`);
  console.log(`  Receiving: ${stats.receivingYards} yards, ${stats.receivingTDs} TDs, ${stats.receiving2PtConversions} 2pts`);
  console.log();
  
  // Manual calculation
  let calculated = 0;
  
  // Passing: 1 pt per 25 yards (no fractional), 4 pts per TD
  const passingPts = Math.floor((stats.passingYards ?? 0) / 25) + ((stats.passingTDs ?? 0) * 4) + ((stats.passing2PtConversions ?? 0) * 1);
  console.log(`Passing points: floor(${stats.passingYards}/25) + ${stats.passingTDs}*4 + ${stats.passing2PtConversions}*1 = ${Math.floor((stats.passingYards ?? 0) / 25)} + ${(stats.passingTDs ?? 0) * 4} + ${(stats.passing2PtConversions ?? 0) * 1} = ${passingPts}`);
  calculated += passingPts;
  
  // Rushing: 1 pt per 10 yards (no fractional), 6 pts per TD
  const rushingPts = Math.floor((stats.rushingYards ?? 0) / 10) + ((stats.rushingTDs ?? 0) * 6) + ((stats.rushing2PtConversions ?? 0) * 2);
  console.log(`Rushing points: floor(${stats.rushingYards}/10) + ${stats.rushingTDs}*6 + ${stats.rushing2PtConversions}*2 = ${Math.floor((stats.rushingYards ?? 0) / 10)} + ${(stats.rushingTDs ?? 0) * 6} + ${(stats.rushing2PtConversions ?? 0) * 2} = ${rushingPts}`);
  calculated += rushingPts;
  
  // Receiving: 1 pt per 10 yards (no fractional), 6 pts per TD
  const receivingPts = Math.floor((stats.receivingYards ?? 0) / 10) + ((stats.receivingTDs ?? 0) * 6) + ((stats.receiving2PtConversions ?? 0) * 2);
  console.log(`Receiving points: floor(${stats.receivingYards}/10) + ${stats.receivingTDs}*6 + ${stats.receiving2PtConversions}*2 = ${Math.floor((stats.receivingYards ?? 0) / 10)} + ${(stats.receivingTDs ?? 0) * 6} + ${(stats.receiving2PtConversions ?? 0) * 2} = ${receivingPts}`);
  calculated += receivingPts;
  
  console.log();
  console.log(`Calculated Total: ${calculated}`);
  console.log(`Database Value: ${stats.fantasyPoints}`);
  console.log(`Match: ${calculated === stats.fantasyPoints ? '✅' : '❌'}`);
}

verifyFantasyPoints();
