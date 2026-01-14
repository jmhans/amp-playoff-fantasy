import { auth0 } from '@/app/lib/auth0';
import { getParticipantById, getOrCreateActiveSeason, getWeekLockTimes } from '@/app/lib/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PicksGrid from './PicksGrid';
import CountdownTimer from './CountdownTimer';
import { isAdmin } from '@/app/lib/auth-utils';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function PicksPage({ params }: Props) {
  const session = await auth0.getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  const { id } = await params;
  const participantId = parseInt(id);
  const participant = await getParticipantById(participantId);
  const season = await getOrCreateActiveSeason();
  const lockTimes = await getWeekLockTimes(season.id);

  if (!participant) {
    redirect('/participants');
  }

  // Check if user owns this participant or is admin
  const isOwner = participant.auth0Id === session.user.sub;
  const userIsAdmin = isAdmin(session.user);
  const canEdit = isOwner || userIsAdmin;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/participants"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
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
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {participant.name} - Picks
        </h2>
      </div>

      {!canEdit && (
        <div className="mb-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-200">
          You are viewing this roster in read-only mode.
        </div>
      )}

      {userIsAdmin && !isOwner && (
        <div className="mb-4 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-200">
          You are viewing as admin and can edit this roster regardless of lock times.
        </div>
      )}

      <CountdownTimer lockTimes={lockTimes} />

      <PicksGrid participantId={participantId} seasonId={season.id} isOwner={canEdit} lockTimes={lockTimes} isAdmin={userIsAdmin} />
    </div>
  );
}
