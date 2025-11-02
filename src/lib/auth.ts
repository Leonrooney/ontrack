import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get session safely in App Router route handlers
 * Works without req/res objects
 */
export async function getSessionSafe() {
  return await getServerSession(authOptions);
}

// Keep for backward compatibility
export async function getSession() {
  return await getSessionSafe();
}

export async function getCurrentUser() {
  const session = await getSessionSafe();
  return session?.user;
}

