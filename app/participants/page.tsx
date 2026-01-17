import { auth0 } from '@/app/lib/auth0';
import { getParticipants, getParticipantByAuth0Id, getAllParticipantsScores, getOrCreateActiveSeason, getPickCompletionStatus, getWeekLockTimes } from '@/app/lib/actions';
import ParticipantsTable from './ParticipantsTable';

export default async function ParticipantsPage() {
  const session = await auth0.getSession();
  const isLoggedIn = !!session?.user;

  const participants = await getParticipants();
  const userParticipant = isLoggedIn ? await getParticipantByAuth0Id(session.user.sub) : null;
  const season = await getOrCreateActiveSeason();
  const scores = await getAllParticipantsScores(season.id);
  const pickStatus = await getPickCompletionStatus(season.id);
  const lockTimes = await getWeekLockTimes(season.id);

  return (
    <ParticipantsTable 
      participants={participants}
      userAuth0Id={isLoggedIn ? session.user.sub : null}
      userHasClaimed={!!userParticipant}
      scores={scores}
      pickStatus={pickStatus}
      lockTimes={lockTimes}
    />
  );
}
