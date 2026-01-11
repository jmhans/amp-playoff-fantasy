import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  out: './drizzle',
  schema: './app/lib/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: ['ampplayoffs'],
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
