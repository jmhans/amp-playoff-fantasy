import { auth0 } from '@/app/lib/auth0';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/app/lib/auth-utils';
import SyncPlayersClient from './SyncPlayersClient';
import HomeButton from '@/app/ui/home-button';

export default async function SyncPlayersPage() {
  const session = await auth0.getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  if (!isAdmin(session.user)) {
    redirect('/');
  }

  return (
    <>
      <div className="p-6">
        <HomeButton />
      </div>
      <SyncPlayersClient />
    </>
  );
}
