'use client';

import { useState } from 'react';
import { claimParticipantAccount } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';

interface Participant {
  id: number;
  name: string;
  email: string | null;
  auth0Id: string | null;
}

interface Score {
  participantId: number;
  week: number;
  totalPoints: number;
}

interface PickStatus {
  participantId: number;
  week: number;
  completedPicks: number;
  totalPicks: number;
}

interface LockTime {
  week: number;
  lockTime: string | Date | null;
}

interface ParticipantsTableProps {
  participants: Participant[];
  userAuth0Id: string | null;
  userHasClaimed: boolean;
  scores: Score[];
  pickStatus: PickStatus[];
  lockTimes: LockTime[];
}

export default function ParticipantsTable({ participants, userAuth0Id, userHasClaimed, scores, pickStatus, lockTimes }: ParticipantsTableProps) {
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<'week1' | 'week2' | 'week3' | 'week5' | 'total'>('total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: 'week1' | 'week2' | 'week3' | 'week5' | 'total') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const isWeekLocked = (week: number) => {
    const lockTime = lockTimes.find(lt => lt.week === week)?.lockTime;
    if (!lockTime) return false;
    return new Date(lockTime) <= new Date();
  };

  const getWeekScore = (participantId: number, week: number) => {
    const score = scores.find(s => s.participantId === participantId && s.week === week);
    return score?.totalPoints || 0;
  };

  const getPickStatus = (participantId: number, week: number) => {
    const status = pickStatus.find(s => s.participantId === participantId && s.week === week);
    return status || { completedPicks: 0, totalPicks: 5 };
  };

  const getWeekDisplay = (participantId: number, week: number) => {
    if (isWeekLocked(week)) {
      const score = getWeekScore(participantId, week);
      return score > 0 ? score.toString() : '-';
    } else {
      const status = getPickStatus(participantId, week);
      return `${status.completedPicks}/${status.totalPicks}`;
    }
  };

  const getCurrentWeek = () => {
    // Find the first unlocked week (skip week 4 - Pro Bowl)
    for (let week of [1, 2, 3, 5]) {
      if (!isWeekLocked(week)) {
        return week;
      }
    }
    return null; // All weeks locked
  };

  const getWeekCellClass = (participantId: number, week: number) => {
    const currentWeek = getCurrentWeek();
    if (currentWeek !== week || isWeekLocked(week)) {
      return "px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white";
    }
    
    const status = getPickStatus(participantId, week);
    const isComplete = status.completedPicks === status.totalPicks;
    
    if (isComplete) {
      return "px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-green-700 dark:text-green-400";
    } else {
      return "px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-red-700 dark:text-red-400";
    }
  };

  const getTotalScore = (participantId: number) => {
    return scores
      .filter(s => s.participantId === participantId)
      .reduce((sum, s) => sum + s.totalPoints, 0);
  };

  const handleClaim = async (participantId: number) => {
    if (!userAuth0Id) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login';
      return;
    }

    setClaimingId(participantId);
    
    try {
      const result = await claimParticipantAccount(participantId, userAuth0Id);
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to claim account');
      }
    } catch (error) {
      alert('An error occurred while claiming the account');
    } finally {
      setClaimingId(null);
    }
  };

  // Sort participants by total score descending
  const sortedParticipants = [...participants].sort((a, b) => {
    let valueA: number;
    let valueB: number;

    if (sortColumn === 'total') {
      valueA = getTotalScore(a.id);
      valueB = getTotalScore(b.id);
    } else {
      const week = parseInt(sortColumn.replace('week', ''));
      valueA = getWeekScore(a.id, week);
      valueB = getWeekScore(b.id, week);
    }

    return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
  });

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedParticipants.map((participant) => {
          const isClaimedByUser = userAuth0Id !== null && participant.auth0Id === userAuth0Id;
          const isClaimed = !!participant.auth0Id;
          const totalScore = getTotalScore(participant.id);

          return (
            <div 
              key={participant.id} 
              className={`bg-white dark:bg-gray-800 shadow rounded-lg p-3 ${
                isClaimedByUser ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {participant.name}
                    {isClaimedByUser && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                    )}
                  </h3>
                  <div className="mt-0.5">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {totalScore} pts
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <a
                    href={`/picks/${participant.id}`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
                    title="View Picks"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  {!isClaimed && userAuth0Id && (
                    <button
                      onClick={() => handleClaim(participant.id)}
                      disabled={claimingId === participant.id}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Claim Team"
                    >
                      {claimingId === participant.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('week1')}
              >
                <div className="flex items-center justify-center gap-1">
                  WK1
                  {sortColumn === 'week1' && (
                    <span className="text-blue-600 dark:text-blue-400">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('week2')}
              >
                <div className="flex items-center justify-center gap-1">
                  WK2
                  {sortColumn === 'week2' && (
                    <span className="text-blue-600 dark:text-blue-400">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('week3')}
              >
                <div className="flex items-center justify-center gap-1">
                  WK3
                  {sortColumn === 'week3' && (
                    <span className="text-blue-600 dark:text-blue-400">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('week5')}
              >
                <div className="flex items-center justify-center gap-1">
                  WK5
                  {sortColumn === 'week5' && (
                    <span className="text-blue-600 dark:text-blue-400">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('total')}
              >
                <div className="flex items-center justify-center gap-1">
                  Total
                  {sortColumn === 'total' && (
                    <span className="text-blue-600 dark:text-blue-400">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Picks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedParticipants.map((participant) => {
              const isClaimedByUser = userAuth0Id !== null && participant.auth0Id === userAuth0Id;
              const isClaimed = !!participant.auth0Id;
              
              return (
                <tr key={participant.id} className={isClaimedByUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {participant.name}
                    {isClaimedByUser && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                    )}
                  </td>
                  <td className={getWeekCellClass(participant.id, 1)}>
                    {getWeekDisplay(participant.id, 1)}
                  </td>
                  <td className={getWeekCellClass(participant.id, 2)}>
                    {getWeekDisplay(participant.id, 2)}
                  </td>
                  <td className={getWeekCellClass(participant.id, 3)}>
                    {getWeekDisplay(participant.id, 3)}
                  </td>
                  <td className={getWeekCellClass(participant.id, 5)}>
                    {getWeekDisplay(participant.id, 5)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900 dark:text-white">
                    {getTotalScore(participant.id) || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isClaimed ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Claimed
                      </span>
                    ) : userAuth0Id ? (
                      <button
                        onClick={() => handleClaim(participant.id)}
                        disabled={claimingId === participant.id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {claimingId === participant.id ? 'Claiming...' : 'Claim'}
                      </button>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={`/picks/${participant.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Picks
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
