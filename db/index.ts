import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

// If DATABASE_URL is not set during initial build, prevent build-time crash with fallback
const sql = neon(connectionString || 'postgresql://dummy:dummy@dummy.neon.tech/dummy?sslmode=require');

export const db = drizzle(sql, { schema });
