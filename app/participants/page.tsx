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

  // Determine current week for scoring updates
  // Use the latest week that has locked (games started/in progress)
  // If no weeks locked yet, use week 1. If all locked, use last week.
  const now = new Date();
  const lockedWeeks = lockTimes
    .filter(lt => lt.lockTime && new Date(lt.lockTime) <= now)
    .sort((a, b) => a.week - b.week); // Sort by week number to ensure correct order
  const currentWeek = lockedWeeks.length > 0 
    ? lockedWeeks[lockedWeeks.length - 1].week 
    : 1;

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
