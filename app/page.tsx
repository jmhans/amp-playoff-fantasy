'use client';

import { lusitana } from '@/app/ui/fonts';
import Navigation from '@/app/ui/navigation';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 dark:bg-blue-600 p-4 md:h-52">
        <h1 className={`${lusitana.className} text-white text-3xl md:text-5xl`}>
          AMP Playoff Fantasy
        </h1>
      </div>
      
      <Navigation />

      <div className="mt-6 flex flex-col items-center justify-center gap-6 md:mt-16">
        <p className={`${lusitana.className} text-xl text-gray-800 dark:text-gray-200 text-center max-w-2xl`}>
          Welcome to AMP Playoff Fantasy! Claim your participant entries and get ready for the playoffs.
        </p>
        
        {/* Temporary direct admin link for testing */}
        <a
          href="/admin"
          className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          Admin Dashboard →
        </a>
      </div>
    </main>
  );
}
