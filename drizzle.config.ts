import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

// Use dev database for local development, prod for CI/CD
const dbUrl = process.env.NODE_ENV === 'production' 
  ? process.env.POSTGRES_URL 
  : (process.env.POSTGRES_URL_DEV || process.env.POSTGRES_URL);

export default defineConfig({
  out: './drizzle',
  schema: './app/lib/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: ['ampplayoffs'],
  dbCredentials: {
    url: dbUrl!,
  },
});
