import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../app/lib/db';
import { games, seasons } from '../app/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function checkGames() {
  const [activeSeason] = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
  
  if (!activeSeason) {
    console.log('No active season found');
    return;
  }

  const week1Games = await db.select().from(games).where(and(
    eq(games.seasonId, activeSeason.id),
    eq(games.week, 1)
  ));

  console.log('Week 1 Games:');
  week1Games.forEach(g => {
    console.log(`  ${g.awayTeam} @ ${g.homeTeam} (spread: ${g.spread})`);
  });
}

checkGames().catch(console.error);
