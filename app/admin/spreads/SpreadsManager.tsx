'use client';

import { useState, useEffect } from 'react';

interface Game {
  id?: number;
  espnGameId: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  spread: number | null;
}

interface SpreadsData {
  games: Game[];
  seasonId: number;
  week: number;
}

export default function SpreadsManager() {
  const [week, setWeek] = useState(1);
  const [spreadsData, setSpreadsData] = useState<SpreadsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadGames = async (selectedWeek: number) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/spreads?week=${selectedWeek}`);
      if (!response.ok) throw new Error('Failed to load games');
      const data = await response.json();
      setSpreadsData(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load games' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames(week);
  }, [week]);

  const handleSpreadChange = (index: number, value: string) => {
    if (!spreadsData) return;

    const newGames = [...spreadsData.games];
    const numValue = value === '' ? null : parseFloat(value);
    
    // Round to nearest 0.5
    if (numValue !== null) {
      newGames[index].spread = Math.round(numValue * 2) / 2;
    } else {
      newGames[index].spread = null;
    }
    
    setSpreadsData({ ...spreadsData, games: newGames });
  };

  const handleSave = async () => {
    if (!spreadsData) return;

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/spreads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonId: spreadsData.seasonId,
          week: spreadsData.week,
          gamesData: spreadsData.games,
        }),
      });

      if (!response.ok) throw new Error('Failed to save spreads');
      
      setMessage({ type: 'success', text: 'Spreads saved successfully!' });
      // Reload to get updated data
      await loadGames(week);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save spreads' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Week
        </label>
        <select
          value={week}
          onChange={(e) => setWeek(parseInt(e.target.value))}
          className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {[1, 2, 3, 4].map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Games List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading games...</p>
        </div>
      ) : spreadsData?.games.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No games found for this week</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Away Team
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  @
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Home Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Game Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Spread (Home)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {spreadsData?.games.map((game, index) => (
                <tr key={game.espnGameId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {game.awayTeam}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                    @
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {game.homeTeam}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(game.gameTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.5"
                      value={game.spread ?? ''}
                      onChange={(e) => handleSpreadChange(index, e.target.value)}
                      placeholder="e.g., 3.5"
                      className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {game.spread !== null && (
                        <>({game.spread > 0 ? '+' : ''}{game.spread})</>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save Button */}
      {spreadsData && spreadsData.games.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Spreads'}
          </button>
        </div>
      )}
    </div>
  );
}
