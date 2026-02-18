import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * Get session safely in App Router route handlers
 * Works without req/res objects (unlike the old Pages Router approach)
 *
 * @returns Session object or null if not authenticated
 */
export async function getSessionSafe() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication for API routes. Returns user id and email, or null if unauthenticated.
 * Use: const auth = await requireAuth(); if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
 * Get the current authenticated user
 *
 * @returns User object from session or undefined if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSessionSafe();
  return session?.user;
}
