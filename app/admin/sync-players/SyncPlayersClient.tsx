'use client';

import { useState } from 'react';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import { importPlayersFromTeams } from '@/app/lib/player-actions';

const NFL_TEAMS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WSH'
];

const POSITIONS = ['QB', 'RB', 'WR', 'TE'];

export default function SyncPlayersPage() {
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set(['QB', 'RB', 'WR', 'TE']));
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  const toggleTeam = (team: string) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(team)) {
      newSelected.delete(team);
    } else {
      newSelected.add(team);
    }
    setSelectedTeams(newSelected);
  };

  const togglePosition = (position: string) => {
    const newSelected = new Set(selectedPositions);
    if (newSelected.has(position)) {
      newSelected.delete(position);
    } else {
      newSelected.add(position);
    }
    setSelectedPositions(newSelected);
  };

  const selectAllTeams = () => {
    setSelectedTeams(new Set(NFL_TEAMS));
  };

  const clearSelection = () => {
    setSelectedTeams(new Set());
  };

  const handleImport = async () => {
    if (selectedTeams.size === 0) {
      setMessage('❌ Please select at least one team');
      return;
    }

    if (selectedPositions.size === 0) {
      setMessage('❌ Please select at least one position');
      return;
    }

    setImporting(true);
    setMessage('Importing players from ESPN...');

    try {
      const result = await importPlayersFromTeams(
        Array.from(selectedTeams),
        Array.from(selectedPositions)
      );
      
      if (result.error) {
        setMessage(`❌ ${result.error}\n\n${result.logs || ''}`);
      } else {
        setMessage(`✅ Success! Imported ${result.count} players from ${result.teamsProcessed} teams\n\n${result.logs || ''}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-white dark:bg-gray-900">
      <Link
        href="/admin"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors mb-4"
      >
        <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
      </Link>

      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 dark:bg-blue-600 p-4 md:h-32 mb-8">
        <h1 className={`${lusitana.className} text-white text-3xl md:text-5xl`}>
          Import NFL Players
        </h1>
      </div>

      <div className="max-w-4xl">
        {/* Instructions */}
        <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Instructions</h2>
          <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
            <li>• Select the NFL teams you want to import players from (playoff teams)</li>
            <li>• Choose which positions to import (QB, RB, WR, TE)</li>
            <li>• Click Import to fetch players from ESPN and save to database</li>
          </ul>
        </div>

        {/* Position Selection */}
        <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white mb-4">Select Positions</h2>
          <div className="flex gap-3 flex-wrap">
            {POSITIONS.map(position => (
              <button
                key={position}
                onClick={() => togglePosition(position)}
                disabled={importing}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPositions.has(position)
                    ? 'bg-blue-500 text-white'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 border dark:text-white'
                }`}
              >
                {position}
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection */}
        <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">
              Select Teams ({selectedTeams.size} selected)
            </h2>
            <div className="flex gap-2">
              <button
                onClick={selectAllTeams}
                disabled={importing}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                onClick={clearSelection}
                disabled={importing}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {NFL_TEAMS.map(team => (
              <button
                key={team}
                onClick={() => toggleTeam(team)}
                disabled={importing}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTeams.has(team)
                    ? 'bg-blue-500 text-white border-2 border-blue-600'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 border dark:text-white'
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </div>

        {/* Import Button */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleImport}
            disabled={importing || selectedTeams.size === 0 || selectedPositions.size === 0}
            className="w-full rounded-lg bg-green-600 dark:bg-green-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 dark:hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? 'Importing Players...' : `Import Players from ${selectedTeams.size} Team${selectedTeams.size !== 1 ? 's' : ''}`}
          </button>

          {message && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap dark:text-white">{message}</pre>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="mt-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
          <h2 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Note</h2>
          <ul className="text-sm text-yellow-900 dark:text-yellow-100 space-y-1">
            <li>• Existing players will be updated with latest data</li>
            <li>• This may take 30-60 seconds depending on team count</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
