import { auth0 } from '@/app/lib/auth0';
import { isAdmin } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import StatsUpdater from './StatsUpdater';

export default async function AdminStatsPage() {
  const session = await auth0.getSession();
  
  if (!session?.user || !isAdmin(session.user)) {
    redirect('/');
  }

  return (
    <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
      <Link
        href="/admin"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors mb-4"
        aria-label="Back to Admin"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
      </Link>

      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 dark:bg-blue-600 p-4 md:h-32 mb-8">
        <h1 className={`${lusitana.className} text-white text-3xl md:text-5xl`}>
          Stats Management
        </h1>
      </div>

      <div className="max-w-2xl">
        <StatsUpdater />
      </div>
    </main>
  );
}
