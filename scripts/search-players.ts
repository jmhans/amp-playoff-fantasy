import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../app/lib/db';
import { players } from '../app/lib/db/schema';
import { ilike } from 'drizzle-orm';

async function searchPlayers() {
  const searches = ['%navis%', '%navi%', '%davis%', '%myers%', '%meyer%'];
  
  for (const search of searches) {
    console.log(`\nSearching for: ${search}`);
    const found = await db.select().from(players).where(ilike(players.name, search));
    if (found.length > 0) {
      found.forEach(p => console.log(`  - ${p.name} (${p.team}, ${p.position})`));
    } else {
      console.log('  (no matches)');
    }
  }
}

searchPlayers().catch(console.error);
