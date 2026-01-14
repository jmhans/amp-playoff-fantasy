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

interface ParticipantsTableProps {
  participants: Participant[];
  userAuth0Id: string | null;
  userHasClaimed: boolean;
  scores: Score[];
}

export default function ParticipantsTable({ participants, userAuth0Id, userHasClaimed, scores }: ParticipantsTableProps) {
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const getWeekScore = (participantId: number, week: number) => {
    const score = scores.find(s => s.participantId === participantId && s.week === week);
    return score?.totalPoints || 0;
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
    const totalA = getTotalScore(a.id);
    const totalB = getTotalScore(b.id);
    return totalB - totalA;
  });

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              WK1
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              WK2
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              WK3
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              WK4
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-bold">
              Total
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                  {getWeekScore(participant.id, 1) || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                  {getWeekScore(participant.id, 2) || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                  {getWeekScore(participant.id, 3) || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                  {getWeekScore(participant.id, 4) || '-'}
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
  );
}
