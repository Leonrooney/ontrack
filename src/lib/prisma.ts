import { PrismaClient } from '@prisma/client';

let url = process.env.DATABASE_URL?.trim() ?? '';
if (!url || (!url.startsWith('postgresql://') && !url.startsWith('postgres://'))) {
  throw new Error(
    'DATABASE_URL is missing or invalid. It must start with postgresql:// or postgres://. ' +
      'Add it to .env or .env.local in the project root (same folder as package.json), then restart the dev server.'
  );
}

// Supabase connection pooler (PgBouncer) does not keep prepared statements across connections.
// Prisma must disable them or you get "prepared statement does not exist" (26000).
if (url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
  url = url + (url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true');
  process.env.DATABASE_URL = url;
}

/**
 * Prisma Client singleton
 *
 * In development, reuses the same instance across hot reloads to prevent
 * "Too many Prisma Clients" errors. In production, creates a new instance.
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
