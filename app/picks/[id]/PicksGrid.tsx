'use client';

import { useState, useEffect } from 'react';
import { getRosterEntries, updateRosterEntry, getEligiblePlayers, initializeRosterEntries } from '@/app/lib/actions';
import PlayerPicker from './PlayerPicker';

interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  espnId?: string | null;
}

interface RosterEntry {
  id: number;
  position: string;
  week: number;
  playerName: string | null;
  playerId: number | null;
  player: Player | null;
}

interface PicksGridProps {
  participantId: number;
  isOwner: boolean;
}

const POSITIONS = ['QB', 'RB', 'WR', 'FLEX', 'TEAM'];
const WEEKS = [1, 2, 3, 4];

export default function PicksGrid({ participantId, isOwner }: PicksGridProps) {
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ position: string; week: number } | null>(null);
  const [eligiblePlayers, setEligiblePlayers] = useState<Player[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [participantId]);

  const loadEntries = async () => {
    try {
      const data = await getRosterEntries(participantId);
      
      // If no entries exist, initialize them
      if (data.length === 0) {
        await initializeRosterEntries(participantId);
        const newData = await getRosterEntries(participantId);
        setEntries(newData);
      } else {
        setEntries(data);
      }
    } catch (error) {
      console.error('Error loading roster entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntryForCell = (position: string, week: number) => {
    return entries.find(e => e.position === position && e.week === week);
  };

  const handleCellClick = async (position: string, week: number) => {
    if (!isOwner) return;
    
    setEditingCell({ position, week });
    
    // Load eligible players for this position
    const players = await getEligiblePlayers(participantId, position);
    setEligiblePlayers(players);
    setShowPicker(true);
  };

  const handlePlayerSelect = async (player: Player | null) => {
    console.log('=== handlePlayerSelect START ===');
    console.log('Player:', player);
    console.log('editingCell:', editingCell);
    
    if (!editingCell) {
      console.log('No editing cell, returning');
      return;
    }

    try {
      const entry = getEntryForCell(editingCell.position, editingCell.week);
      console.log('Entry found:', entry);
      
      if (entry) {
        console.log('Updating entry:', entry.id, 'with player:', player);
        const result = await updateRosterEntry(
          entry.id, 
          player?.id ?? null, 
          player?.name ?? ''
        );
        console.log('Update result:', result);
      }
      
      console.log('Reloading entries...');
      await loadEntries();
      console.log('Entries reloaded');
      setShowPicker(false);
      setEditingCell(null);
      setEligiblePlayers([]);
      console.log('=== handlePlayerSelect END ===');
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry');
    }
  };

  const handleCancel = () => {
    setShowPicker(false);
    setEditingCell(null);
    setEligiblePlayers([]);
  };

  const getPlayerImageUrl = (espnId?: string | null) => {
    if (!espnId) return null;
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`;
  };

  if (loading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading picks...</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                Position
              </th>
              {WEEKS.map(week => (
                <th
                  key={week}
                  className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center font-semibold text-gray-900 dark:text-white"
                >
                  Week {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {POSITIONS.map(position => (
              <tr key={position} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {position}
                </td>
                {WEEKS.map(week => {
                  const entry = getEntryForCell(position, week);
                  const player = entry?.player;
                  const imageUrl = player?.espnId ? getPlayerImageUrl(player.espnId) : null;

                  return (
                    <td
                      key={week}
                      className={`border border-gray-300 dark:border-gray-700 px-2 py-2 ${
                        isOwner ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleCellClick(position, week)}
                    >
                      {entry?.playerName ? (
                        <div className="flex items-center gap-2 min-h-[48px]">
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={entry.playerName}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {entry.playerName}
                            </div>
                            {player && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {player.position} - {player.team}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 dark:text-gray-500 italic text-sm py-3">
                          {isOwner ? 'Click to select' : 'Empty'}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPicker && editingCell && (
        <PlayerPicker
          eligiblePlayers={eligiblePlayers}
          onSelect={handlePlayerSelect}
          onCancel={handleCancel}
          currentPlayer={getEntryForCell(editingCell.position, editingCell.week)?.playerName || undefined}
        />
      )}
    </>
  );
}
