import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

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
 * Alias for getSessionSafe() - kept for backward compatibility
 * @deprecated Use getSessionSafe() instead
 */
export async function getSession() {
  return await getSessionSafe();
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
