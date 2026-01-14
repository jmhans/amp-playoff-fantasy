import Link from 'next/link';
import { auth0 } from '@/app/lib/auth0';
import { redirect } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import { isAdmin } from '@/app/lib/auth-utils';
import HomeButton from '@/app/ui/home-button';

export default async function AdminPage() {
  const session = await auth0.getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  const userIsAdmin = isAdmin(session.user);

  if (!userIsAdmin) {
    return (
      <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors mb-4"
        >
          <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </Link>

        <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 dark:bg-blue-600 p-4 md:h-32 mb-8">
          <h1 className={`${lusitana.className} text-white text-3xl md:text-5xl`}>
            Admin Dashboard
          </h1>
        </div>

        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-red-800 dark:text-red-200 font-medium">Access Denied</p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
      <HomeButton />

      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 dark:bg-blue-600 p-4 md:h-32 mb-8">
        <h1 className={`${lusitana.className} text-white text-3xl md:text-5xl`}>
          Admin Dashboard
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Sync Players Card */}
        <Link
          href="/admin/sync-players"
          className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">
                Sync Players
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Import from ESPN API
              </p>
            </div>
          </div>
        </Link>

        {/* Manage Spreads Card */}
        <Link
          href="/admin/spreads"
          className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600">
                Manage Spreads
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set game spreads by week
              </p>
            </div>
          </div>
        </Link>

        {/* Update Stats Card */}
        <Link
          href="/admin/stats"
          className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600">
                Update Stats
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fetch live game stats
              </p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
