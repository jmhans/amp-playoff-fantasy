'use client';

import { useState } from 'react';

export default function StatsUpdater() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [week, setWeek] = useState(1);
  const [seasonId] = useState(1);

  const handleUpdate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/stats/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seasonId, week }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to update stats' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Update Player Stats
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Week
          </label>
          <select
            value={week}
            onChange={(e) => setWeek(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={1}>Week 1 (Wild Card)</option>
            <option value={2}>Week 2 (Divisional)</option>
            <option value={3}>Week 3 (Conference)</option>
            <option value={4}>Week 4 (Super Bowl)</option>
          </select>
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Stats from ESPN'}
        </button>

        {result && (
          <div
            className={`p-4 rounded-md ${
              result.error
                ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            }`}
          >
            {result.error ? (
              <p>{result.error}</p>
            ) : (
              <div>
                <p className="font-semibold mb-2">Update Complete!</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Games processed: {result.gamesProcessed}</li>
                  {result.gamesSkipped && result.gamesSkipped > 0 && (
                    <li className="text-yellow-700 dark:text-yellow-400">⚠️ Games skipped (no ESPN ID): {result.gamesSkipped}</li>
                  )}
                  <li>Player stats updated: {result.updatedPlayers}</li>
                  <li>Team picks updated: {result.updatedTeams}</li>
                </ul>
                {result.gamesSkipped && result.gamesSkipped > 0 && (
                  <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    💡 Tip: If games were skipped, use Admin → Manage Spreads to reload Week {week} games from ESPN
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          <p className="font-semibold mb-2">Update Frequency Recommendations:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>During live games: Every 2 minutes</li>
            <li>Recently completed games: Every 15 minutes</li>
            <li>No updates needed for games not yet started</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
