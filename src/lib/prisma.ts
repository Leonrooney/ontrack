import { PrismaClient } from '@prisma/client';

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
