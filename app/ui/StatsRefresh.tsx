'use client';

import { useState, useEffect } from 'react';

interface StatsRefreshProps {
  seasonId: number;
  week: number;
  isAdmin?: boolean;
}

export default function StatsRefresh({ seasonId, week, isAdmin = false }: StatsRefreshProps) {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [canRefresh, setCanRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Fetch last update time
  const fetchLastUpdate = async () => {
    try {
      const response = await fetch('/api/stats/last-update');
      const data = await response.json();
      setLastUpdated(data.lastUpdated);
      setCanRefresh(data.canRefresh);
    } catch (error) {
      console.error('Error fetching last update:', error);
    }
  };

  // Update time ago display
  useEffect(() => {
    if (!lastUpdated) {
      setTimeAgo('Never');
      return;
    }

    const updateTimeAgo = () => {
      const now = Date.now();
      const lastUpdateTime = new Date(lastUpdated).getTime();
      const diffMs = now - lastUpdateTime;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) {
        setTimeAgo('Just now');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`);
      } else {
        setTimeAgo(`${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`);
      }

      // Update canRefresh based on time (admins can always refresh)
      if (!isAdmin) {
        setCanRefresh(diffMins >= 10);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Initial fetch
  useEffect(() => {
    fetchLastUpdate();
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    if (!canRefresh && !isAdmin) return;

    setIsRefreshing(true);
    try {
      const response = await fetch('/api/stats/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId, week }),
      });

      const data = await response.json();
      
      if (data.success) {
        setLastUpdated(data.lastUpdated);
        if (!isAdmin) {
          setCanRefresh(false);
        }
        // Show success message (optional)
        alert(`Stats updated! ${data.updatedPlayers} players and ${data.updatedTeams} teams updated.`);
      } else {
        alert('Failed to update stats. Please try again.');
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
      alert('Error refreshing stats. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Stats Last Updated
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {timeAgo}
        </div>
      </div>
      
      <button
        onClick={handleRefresh}
        disabled={(!canRefresh && !isAdmin) || isRefreshing}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          (canRefresh || isAdmin) && !isRefreshing
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
        }`}
      >
        {isRefreshing ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Updating...
          </span>
        ) : (
          '🔄 Refresh Stats'
        )}
      </button>
      
      {!isAdmin && !canRefresh && !isRefreshing && lastUpdated && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          (wait {Math.max(0, 10 - Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60)))} mins)
        </div>
      )}
    </div>
  );
}
