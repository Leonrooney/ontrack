import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

const SALT_ROUNDS = 12;

/** Compare plain password with hash (e.g. for login or change-password). */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Get session safely in App Router route handlers.
 * @returns Session object or null if not authenticated
 */
export async function getSessionSafe() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication for API routes. Returns user id and email, or null if unauthenticated.
 * @deprecated Prefer requireAuthOr401() for one-line auth check in route handlers.
 */
export async function requireAuth(): Promise<
  { userId: string; email: string } | null
> {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return null;
  return { userId: user.id, email };
}

/**
 * Require authentication for API routes. Returns auth object or a 401 NextResponse.
 * Use: const auth = await requireAuthOr401(); if (auth instanceof NextResponse) return auth;
 */
export async function requireAuthOr401(): Promise<
  { userId: string; email: string } | NextResponse
> {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return auth;
}

/**
 * Hash a password for storage. Use for registration and password reset flows.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Get the current authenticated user.
 * @returns User object from session or undefined if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSessionSafe();
  return session?.user;
}
