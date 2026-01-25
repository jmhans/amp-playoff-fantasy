import { auth0 } from '@/app/lib/auth0';
import { getParticipants, getParticipantByAuth0Id, getAllParticipantsScores, getOrCreateActiveSeason, getPickCompletionStatus, getWeekLockTimes } from '@/app/lib/actions';
import ParticipantsTable from './ParticipantsTable';
import StatsRefresh from '@/app/ui/StatsRefresh';
import { isAdmin } from '@/app/lib/auth-utils';

export default async function ParticipantsPage() {
  const session = await auth0.getSession();
  const isLoggedIn = !!session?.user;

  const participants = await getParticipants();
  const userParticipant = isLoggedIn ? await getParticipantByAuth0Id(session.user.sub) : null;
  const userIsAdmin = isLoggedIn ? isAdmin(session.user) : false;
  const season = await getOrCreateActiveSeason();
  const scores = await getAllParticipantsScores(season.id);
  const pickStatus = await getPickCompletionStatus(season.id);
  const lockTimes = await getWeekLockTimes(season.id);

  // Determine current week - find the first unlocked week, or the last week if all locked
  const now = new Date();
  const currentWeek = lockTimes.find(lt => lt.lockTime && new Date(lt.lockTime) > now)?.week 
    || lockTimes[lockTimes.length - 1]?.week 
    || 1;

  return (
    <div className="space-y-6">
      <StatsRefresh seasonId={season.id} week={currentWeek} isAdmin={userIsAdmin} />
      
      <ParticipantsTable 
        participants={participants}
        userAuth0Id={isLoggedIn ? session.user.sub : null}
        userHasClaimed={!!userParticipant}
        scores={scores}
        pickStatus={pickStatus}
        lockTimes={lockTimes}
      />
    </div>
  );
}
