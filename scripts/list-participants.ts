import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../app/lib/db';
import { participants } from '../app/lib/db/schema';

async function listParticipants() {
  const allParticipants = await db.select().from(participants);
  console.log(`Total: ${allParticipants.length} participants\n`);
  console.log(allParticipants.map((p, i) => `${i + 1}. ${p.name} (ID: ${p.id})`).join('\n'));
}

listParticipants().catch(console.error);
