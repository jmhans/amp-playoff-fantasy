'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  spread: number | null;
  gameTime: string;
}

interface TeamPickerProps {
  seasonId: number;
  week: number;
  currentSelection?: {
    gameId: number;
    pickedTeam: string;
  } | null;
  onSelect: (gameId: number, team: string, spread: number | null) => void;
  onClose: () => void;
}

export default function TeamPicker({ seasonId, week, currentSelection, onSelect, onClose }: TeamPickerProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(`/api/games?seasonId=${seasonId}&week=${week}`);
        const data = await response.json();
        setGames(data.games || []);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [seasonId, week]);

  const getTeamLogoUrl = (team: string) => {
    return `https://a.espncdn.com/i/teamlogos/nfl/500/${team}.png`;
  };

  const formatSpread = (spread: number | null, isHome: boolean) => {
    if (spread === null) return 'PK';
    const displaySpread = isHome ? spread : -spread;
    if (displaySpread === 0) return 'PK';
    return displaySpread > 0 ? `+${displaySpread}` : displaySpread.toString();
  };

  const handleTeamClick = (gameId: number, team: string, spread: number | null, isHome: boolean) => {
    // No longer need to calculate spread here - it's stored in games table
    onSelect(gameId, team, null);
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading games...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pick a Team (Week {week})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {games.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No games available for this week yet. Admin needs to set spreads.
          </p>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div
                key={game.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Away Team */}
                  <button
                    onClick={() => handleTeamClick(game.id, game.awayTeam, game.spread, false)}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                      currentSelection?.gameId === game.id && currentSelection?.pickedTeam === game.awayTeam
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="relative w-16 h-16 mb-2">
                      <Image
                        src={getTeamLogoUrl(game.awayTeam)}
                        alt={game.awayTeam}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {game.awayTeam}
                    </div>
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatSpread(game.spread, false)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      @ {game.homeTeam}
                    </div>
                  </button>

                  {/* Home Team */}
                  <button
                    onClick={() => handleTeamClick(game.id, game.homeTeam, game.spread, true)}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                      currentSelection?.gameId === game.id && currentSelection?.pickedTeam === game.homeTeam
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="relative w-16 h-16 mb-2">
                      <Image
                        src={getTeamLogoUrl(game.homeTeam)}
                        alt={game.homeTeam}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {game.homeTeam}
                    </div>
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatSpread(game.spread, true)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      vs {game.awayTeam}
                    </div>
                  </button>
                </div>

                {/* Game Time */}
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(game.gameTime).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
