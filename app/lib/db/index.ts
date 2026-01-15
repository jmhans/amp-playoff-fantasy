import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Use dev database for local development (when POSTGRES_URL_DEV is set)
// Use prod database for production deployments
const dbUrl = process.env.POSTGRES_URL_DEV || process.env.POSTGRES_URL;

if (!dbUrl) {
  throw new Error('Database URL not found. Set POSTGRES_URL or POSTGRES_URL_DEV in environment variables.');
}

const sql = neon(dbUrl);
export const db = drizzle(sql, { schema });
