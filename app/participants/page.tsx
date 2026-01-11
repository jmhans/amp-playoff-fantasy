import { getSession } from '@auth0/nextjs-auth0';
import { getParticipants, getParticipantByAuth0Id } from '@/app/lib/actions';
import { redirect } from 'next/navigation';
import ParticipantsTable from './ParticipantsTable';
import { lusitana } from '@/app/ui/fonts';
import Link from 'next/link';

export default async function ParticipantsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/api/auth/login');
  }

  const participants = await getParticipants();
  const userParticipant = await getParticipantByAuth0Id(session.user.sub);

  return (
    <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
      <Link
        href="/"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors mb-4"
        aria-label="Back to Home"
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
          Participants
        </h1>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {userParticipant 
            ? `You can claim multiple participant entries. Currently claimed: ${participants.filter(p => p.auth0Id === session.user.sub).length}` 
            : 'Claim your participant entries below'}
        </p>
      </div>

      <ParticipantsTable 
        participants={participants}
        userAuth0Id={session.user.sub}
        userHasClaimed={!!userParticipant}
      />
    </main>
  );
}
