'use client';

import { useState } from 'react';

export default function FixTeamPointsPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFix = async () => {
    setIsFixing(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/stats/fix-team-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId: 1, week: 2 }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error fixing team points:', error);
      setResult({ error: 'Failed to fix team points' });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          🔧 Fix Team Spread Points
        </h1>
        
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>What this does:</strong> Resets fantasy points for TEAM picks in non-final games.
            This fixes the issue where spread points were awarded before games finished.
          </p>
        </div>

        <button
          onClick={handleFix}
          disabled={isFixing}
          className={`w-full px-6 py-3 rounded-lg font-medium text-white transition-colors ${
            isFixing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isFixing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Resetting Points...
            </span>
          ) : (
            '🔄 Reset Team Points for Non-Final Games'
          )}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.error 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          }`}>
            {result.error ? (
              <div className="text-red-800 dark:text-red-200">
                <p className="font-semibold">❌ Error</p>
                <p className="text-sm mt-1">{result.error}</p>
              </div>
            ) : result.message ? (
              <div className="text-blue-800 dark:text-blue-200">
                <p className="font-semibold">ℹ️ {result.message}</p>
                <p className="text-sm mt-1">Games checked: {result.gamesChecked}</p>
              </div>
            ) : (
              <div className="text-green-800 dark:text-green-200">
                <p className="font-semibold">✅ Success!</p>
                <div className="text-sm mt-2 space-y-1">
                  <p>Reset {result.resetCount} team roster entries</p>
                  <p>Non-final games: {result.nonFinalGames}</p>
                  <p>Total games: {result.totalGames}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">ℹ️ How it works:</h3>
          <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
            <li>Checks all Week 2 games</li>
            <li>Identifies games that aren't final (in progress or scheduled)</li>
            <li>Resets fantasy points to null for TEAM picks in those games</li>
            <li>Points will be correctly calculated when games finish</li>
          </ol>
        </div>

        <div className="mt-4">
          <a
            href="/admin"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Admin
          </a>
        </div>
      </div>
    </div>
  );
}
