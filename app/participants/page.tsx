import { auth0 } from '@/app/lib/auth0';
import { getParticipants, getParticipantByAuth0Id, getAllParticipantsScores, getOrCreateActiveSeason } from '@/app/lib/actions';
import { redirect } from 'next/navigation';
import ParticipantsTable from './ParticipantsTable';
import { lusitana } from '@/app/ui/fonts';
import Link from 'next/link';
import HomeButton from '@/app/ui/home-button';
import Navigation from '@/app/ui/navigation';

export default async function ParticipantsPage() {
  const session = await auth0.getSession();
  const isLoggedIn = !!session?.user;

  const participants = await getParticipants();
  const userParticipant = isLoggedIn ? await getParticipantByAuth0Id(session.user.sub) : null;
  const season = await getOrCreateActiveSeason();
  const scores = await getAllParticipantsScores(season.id);

  return (
    <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 dark:bg-blue-600 p-4 md:h-32 mb-8">
        <h1 className={`${lusitana.className} text-white text-3xl md:text-5xl`}>
          AMP Playoff Fantasy
        </h1>
      </div>

      <Navigation />

      <div className="mb-6">
        {!isLoggedIn ? (
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-200">
            <a href="/auth/login" className="font-semibold underline hover:text-blue-600">
              Log in
            </a>{' '}
            to claim your entry and make picks!
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {userParticipant 
              ? `You can claim multiple participant entries. Currently claimed: ${participants.filter(p => p.auth0Id === session.user.sub).length}` 
              : 'Claim your participant entries below'}
          </p>
        )}
      </div>

      <ParticipantsTable 
        participants={participants}
        userAuth0Id={isLoggedIn ? session.user.sub : null}
        userHasClaimed={!!userParticipant}
        scores={scores}
      />
    </main>
  );
}
