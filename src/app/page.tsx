import { redirect } from 'next/navigation';
import { getSessionSafe } from '@/lib/auth';

export default async function Home() {
  const session = await getSessionSafe();

  // If not authenticated, redirect to login
  if (!session) {
    redirect('/login');
  }

  // If authenticated, redirect to dashboard
  redirect('/dashboard');
}
