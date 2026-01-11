import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgSchema, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

// Load environment variables
config({ path: '.env.local' });

// Define schema with ampplayoffs prefix
const ampPlayoffsSchema = pgSchema('ampplayoffs');

const participants = ampPlayoffsSchema.table('participants', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  auth0Id: varchar('auth0_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create database connection
const sql = neon(process.env.POSTGRES_URL!);
const db = drizzle(sql);

const participantNames = [
  'John B',
  'Monica B',
  'Ainsley B',
  'Will B',
  'Shoup',
  'Tim F',
  'Jason G',
  'Drew G',
  'Alex F1',
  'Alex F2',
  'Alex F3',
  'Erin S',
  'Bea N',
  'Erin N',
  'Nick H',
  'Mike M1',
  'Mike M2',
  'Luke D',
  'Peter K',
  'Jon H',
  'Tim A',
  'Jeff E',
  'Mitch S',
  'Jenna S',
  'Anne H1',
  'Anne H2',
  'Robert S',
  'Tony M',
  'Sean O',
  'Lewis O',
  'Anju G',
  'JHanson1',
  'JHanson2',
  'Ryan H',
  'Mike P',
  'Sarah P',
  'Greeno',
  'Karli S',
  'Alex T',
  'Joyce T',
  'Jeff H1',
  'Jeff H2',
  'Matthew S',
  'Reid S',
  'Andy F',
  'Matt G',
  'Adam M',
  'John M',
];

async function seedParticipants() {
  try {
    console.log('Seeding participants...');
    
    for (const name of participantNames) {
      await db.insert(participants).values({
        name,
        email: null,
        auth0Id: null,
      });
      console.log(`Added: ${name}`);
    }
    
    console.log(`\n✅ Successfully added ${participantNames.length} participants!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding participants:', error);
    process.exit(1);
  }
}

seedParticipants();
