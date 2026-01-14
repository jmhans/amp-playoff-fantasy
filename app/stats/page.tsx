import { auth0 } from '@/app/lib/auth0';
import { getOrCreateActiveSeason, getPlayerStatsForWeek } from '@/app/lib/actions';
import PlayerStatsTable from './PlayerStatsTable';

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function PlayerStatsPage({ searchParams }: Props) {
  const params = await searchParams;
  const season = await getOrCreateActiveSeason();
  
  // Determine current week based on which weeks are locked
  const currentDate = new Date();
  let currentWeek = 1;
  
  // TODO: Could determine current week from lock times if needed
  // For now, default to week in URL or week 1
  
  const selectedWeek = params.week ? parseInt(params.week) : currentWeek;
  const playerStats = await getPlayerStatsForWeek(season.id, selectedWeek);

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Player Stats
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          View stats for rostered players by week
        </p>
      </div>

      <PlayerStatsTable 
        playerStats={playerStats}
        currentWeek={selectedWeek}
        seasonId={season.id}
      />
    </div>
  );
}
