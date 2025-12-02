import { redirect } from 'next/navigation';
import { getSessionSafe } from '@/lib/auth';
import { ProfilePageClient } from './ProfilePageClient';

export default async function ProfilePage() {
  const session = await getSessionSafe();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return <ProfilePageClient />;
}
