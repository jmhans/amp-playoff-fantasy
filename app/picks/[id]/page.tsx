import { getSession } from '@auth0/nextjs-auth0';
import { getParticipantById } from '@/app/lib/actions';
import { redirect } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import Link from 'next/link';
import PicksGrid from './PicksGrid';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function PicksPage({ params }: Props) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/api/auth/login');
  }

  const { id } = await params;
  const participantId = parseInt(id);
  const participant = await getParticipantById(participantId);

  if (!participant) {
    redirect('/participants');
  }

  // Check if user owns this participant
  const isOwner = participant.auth0Id === session.user.sub;

  return (
    <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
      <Link
        href="/participants"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors mb-4"
        aria-label="Back to Participants"
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
          {participant.name} - Picks
        </h1>
      </div>

      {!isOwner && (
        <div className="mb-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-200">
          You are viewing this roster in read-only mode.
        </div>
      )}

      <PicksGrid participantId={participantId} isOwner={isOwner} />
    </main>
  );
}
