'use client';

import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { lusitana } from '@/app/ui/fonts';
import { isAdmin } from '@/app/lib/auth-utils';

export default function AdminPage() {
  const { user, isLoading } = useUser();
  const userIsAdmin = user ? isAdmin(user) : false;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!user || !userIsAdmin) {
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
      </div>
    </main>
  );
}
