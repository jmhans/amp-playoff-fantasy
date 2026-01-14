'use client';

import { useState, useEffect } from 'react';
import { getRosterEntries, updateRosterEntry, getEligiblePlayers, initializeRosterEntries } from '@/app/lib/actions';
import PlayerPicker from './PlayerPicker';
import TeamPicker from './TeamPicker';
import Image from 'next/image';

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
  gameId: number | null;
  pickedTeam: string | null;
  pickedSpread: number | null;
  fantasyPoints: number | null;
}

interface PicksGridProps {
  participantId: number;
  seasonId: number;
  isOwner: boolean;
  lockTimes: Array<{ week: number; lockTime: string | Date | null }>;
  isAdmin?: boolean;
}

const POSITIONS = ['QB', 'RB', 'WR', 'FLEX', 'TEAM'];
const WEEKS = [1, 2, 3, 4];

export default function PicksGrid({ participantId, seasonId, isOwner, lockTimes, isAdmin = false }: PicksGridProps) {
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ position: string; week: number } | null>(null);
  const [eligiblePlayers, setEligiblePlayers] = useState<Player[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);

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

  const isWeekLocked = (week: number): boolean => {
    // Admins can always edit regardless of lock time
    if (isAdmin) return false;
    
    const weekLockTime = lockTimes.find(lt => lt.week === week)?.lockTime;
    if (!weekLockTime) return false;
    return new Date() >= new Date(weekLockTime);
  };

  const handleCellClick = async (position: string, week: number) => {
    if (!isOwner || isWeekLocked(week)) return;
    
    setEditingCell({ position, week });
    
    if (position === 'TEAM') {
      setShowTeamPicker(true);
    } else {
      // Load eligible players for this position and week
      const players = await getEligiblePlayers(participantId, position, seasonId, week);
      setEligiblePlayers(players);
      setShowPicker(true);
    }
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
    setShowTeamPicker(false);
    setEditingCell(null);
    setEligiblePlayers([]);
  };

  const handleTeamSelect = async (gameId: number, team: string, spread: number | null) => {
    if (!editingCell) return;

    try {
      const entry = getEntryForCell(editingCell.position, editingCell.week);
      
      if (entry) {
        await updateRosterEntry(entry.id, null, team, gameId, team, spread);
      }
      
      await loadEntries();
      setShowTeamPicker(false);
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Failed to save team');
    }
  };

  const getTeamLogoUrl = (team: string) => {
    return `https://a.espncdn.com/i/teamlogos/nfl/500/${team}.png`;
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
                  const isTeamPosition = position === 'TEAM';
                  const locked = isWeekLocked(week);

                  return (
                    <td
                      key={week}
                      className={`border border-gray-300 dark:border-gray-700 px-2 py-2 ${
                        locked 
                          ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' 
                          : isOwner 
                            ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                            : ''
                      }`}
                      onClick={() => handleCellClick(position, week)}
                      title={locked ? 'Week locked' : undefined}
                    >
                      {isTeamPosition && entry?.pickedTeam ? (
                        <div className="flex flex-col items-center gap-2 min-h-[48px]">
                          <div className="relative w-12 h-12">
                            <Image
                              src={getTeamLogoUrl(entry.pickedTeam)}
                              alt={entry.pickedTeam}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <div className="text-xs font-semibold text-gray-900 dark:text-white">
                            {entry.pickedTeam}
                          </div>
                          {entry.pickedSpread !== null && (
                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {entry.pickedSpread === 0 
                                ? 'PK' 
                                : entry.pickedSpread > 0 
                                  ? `+${entry.pickedSpread}` 
                                  : entry.pickedSpread}
                            </div>
                          )}
                          {entry.fantasyPoints !== null && entry.fantasyPoints !== undefined && (
                            <div className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">
                              {entry.fantasyPoints} pts
                            </div>
                          )}
                        </div>
                      ) : entry?.playerName ? (
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
                            {entry.fantasyPoints !== null && entry.fantasyPoints !== undefined && (
                              <div className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">
                                {entry.fantasyPoints} pts
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

      {showTeamPicker && editingCell && (
        <TeamPicker
          seasonId={seasonId}
          week={editingCell.week}
          currentSelection={
            getEntryForCell(editingCell.position, editingCell.week)?.gameId && 
            getEntryForCell(editingCell.position, editingCell.week)?.pickedTeam
              ? {
                  gameId: getEntryForCell(editingCell.position, editingCell.week)!.gameId!,
                  pickedTeam: getEntryForCell(editingCell.position, editingCell.week)!.pickedTeam!,
                }
              : null
          }
          onSelect={handleTeamSelect}
          onClose={handleCancel}
        />
      )}
    </>
  );
}
