'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PlayerStat {
  playerId: number;
  playerName: string;
  position: string;
  team: string;
  rosterCount: number;
  passingYards: number | null;
  passingTDs: number | null;
  passing2PtConversions: number | null;
  rushingYards: number | null;
  rushingTDs: number | null;
  rushing2PtConversions: number | null;
  receivingYards: number | null;
  receivingTDs: number | null;
  receiving2PtConversions: number | null;
  fantasyPoints: number | null;
}

interface Props {
  playerStats: PlayerStat[];
  currentWeek: number;
  seasonId: number;
}

type SortField = 'rosterCount' | 'passingYards' | 'passingTDs' | 'rushingYards' | 'rushingTDs' | 'receivingYards' | 'receivingTDs' | 'fantasyPoints';
type SortDirection = 'asc' | 'desc';

export default function PlayerStatsTable({ playerStats, currentWeek, seasonId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('fantasyPoints');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleWeekChange = (week: number) => {
    router.push(`/stats?week=${week}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get unique positions and teams for filters
  const positions = useMemo(() => {
    const unique = new Set(playerStats.map(p => p.position));
    return ['all', ...Array.from(unique).sort()];
  }, [playerStats]);

  const teams = useMemo(() => {
    const unique = new Set(playerStats.map(p => p.team));
    return ['all', ...Array.from(unique).sort()];
  }, [playerStats]);

  // Apply filters and sorting
  const sortedStats = useMemo(() => {
    let filtered = [...playerStats];
    
    // Apply filters
    if (positionFilter !== 'all') {
      filtered = filtered.filter(p => p.position === positionFilter);
    }
    if (teamFilter !== 'all') {
      filtered = filtered.filter(p => p.team === teamFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return filtered;
  }, [playerStats, positionFilter, teamFilter, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-400">⇅</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="week-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Week:
          </label>
          <select
            id="week-select"
            value={currentWeek}
            onChange={(e) => handleWeekChange(parseInt(e.target.value))}
            className="block w-32 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
          >
            <option value={1}>Week 1</option>
            <option value={2}>Week 2</option>
            <option value={3}>Week 3</option>
            <option value={4}>Week 4</option>
            <option value={5}>Week 5</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="position-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Position:
          </label>
          <select
            id="position-filter"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="block w-32 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
          >
            {positions.map(pos => (
              <option key={pos} value={pos}>
                {pos === 'all' ? 'All' : pos}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="team-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Team:
          </label>
          <select
            id="team-filter"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="block w-32 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
          >
            {teams.map(team => (
              <option key={team} value={team}>
                {team === 'all' ? 'All' : team}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedStats.map((stat) => (
          <div key={stat.playerId} className="bg-white dark:bg-gray-800 shadow rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {stat.playerName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.position} • {stat.team} • On {stat.rosterCount} {stat.rosterCount === 1 ? 'roster' : 'rosters'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {stat.fantasyPoints || 0} pts
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(stat.passingYards || 0) > 0 && (
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Pass:</span> {stat.passingYards} yd, {stat.passingTDs} TD
                  {(stat.passing2PtConversions || 0) > 0 && `, ${stat.passing2PtConversions} 2pt`}
                </div>
              )}
              {(stat.rushingYards || 0) > 0 && (
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Rush:</span> {stat.rushingYards} yd, {stat.rushingTDs} TD
                  {(stat.rushing2PtConversions || 0) > 0 && `, ${stat.rushing2PtConversions} 2pt`}
                </div>
              )}
              {(stat.receivingYards || 0) > 0 && (
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Rec:</span> {stat.receivingYards} yd, {stat.receivingTDs} TD
                  {(stat.receiving2PtConversions || 0) > 0 && `, ${stat.receiving2PtConversions} 2pt`}
                </div>
              )}
            </div>
          </div>
        ))}
        {sortedStats.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No stats available for Week {currentWeek}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Team
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('rosterCount')}
                >
                  Rosters <SortIcon field="rosterCount" />
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('passingYards')}
                >
                  Pass YDs <SortIcon field="passingYards" />
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('passingTDs')}
                >
                  Pass TDs <SortIcon field="passingTDs" />
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('rushingYards')}
                >
                  Rush YDs <SortIcon field="rushingYards" />
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('rushingTDs')}
                >
                  Rush TDs <SortIcon field="rushingTDs" />
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('receivingYards')}
                >
                  Rec YDs <SortIcon field="receivingYards" />
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('receivingTDs')}
                >
                  Rec TDs <SortIcon field="receivingTDs" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  2PT
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('fantasyPoints')}
                >
                  Pts <SortIcon field="fantasyPoints" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedStats.map((stat) => {
                const total2pt = (stat.passing2PtConversions || 0) + (stat.rushing2PtConversions || 0) + (stat.receiving2PtConversions || 0);
                return (
                  <tr key={stat.playerId}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {stat.playerName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {stat.position}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {stat.team}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {stat.rosterCount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {stat.passingYards || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {stat.passingTDs || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {stat.rushingYards || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {stat.rushingTDs || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {stat.receivingYards || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {stat.receivingTDs || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {total2pt || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-gray-900 dark:text-white">
                      {stat.fantasyPoints || 0}
                    </td>
                  </tr>
                );
              })}
              {sortedStats.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No stats available for Week {currentWeek}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
