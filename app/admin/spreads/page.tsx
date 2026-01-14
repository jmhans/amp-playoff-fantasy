import { auth0 } from '@/app/lib/auth0';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/app/lib/auth-utils';
import SpreadsManager from './SpreadsManager';
import HomeButton from '@/app/ui/home-button';

export default async function SpreadsPage() {
  const session = await auth0.getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  if (!isAdmin(session.user)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HomeButton />
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Game Spreads
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Set spreads for playoff games. Spread is applied to the home team (positive = home favored).
          </p>
        </div>

        <SpreadsManager />
      </div>
    </div>
  );
}
