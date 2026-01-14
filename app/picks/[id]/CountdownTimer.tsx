'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  lockTimes: Array<{ week: number; lockTime: string | Date | null }>;
}

export default function CountdownTimer({ lockTimes }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [nextLockWeek, setNextLockWeek] = useState<number | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      
      // If no lock times, all weeks are open
      if (lockTimes.length === 0) {
        setTimeLeft('No lock times set');
        setNextLockWeek(null);
        return;
      }
      
      // Find the next upcoming lock time
      const upcomingLocks = lockTimes
        .filter(lt => lt.lockTime && new Date(lt.lockTime) > now)
        .sort((a, b) => new Date(a.lockTime!).getTime() - new Date(b.lockTime!).getTime());
      
      if (upcomingLocks.length === 0) {
        setTimeLeft('All weeks locked');
        setNextLockWeek(null);
        return;
      }

      const nextLock = upcomingLocks[0];
      const lockTime = new Date(nextLock.lockTime!);
      const diff = lockTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Locked');
        setNextLockWeek(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) {
        timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      } else if (hours > 0) {
        timeString = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        timeString = `${minutes}m ${seconds}s`;
      } else {
        timeString = `${seconds}s`;
      }

      setTimeLeft(timeString);
      setNextLockWeek(nextLock.week);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lockTimes]);

  if (!nextLockWeek) {
    // Show different message for no lock times vs all locked
    const isAllLocked = lockTimes.length > 0 && timeLeft === 'All weeks locked';
    
    return (
      <div className={`border rounded-lg p-4 mb-6 ${
        isAllLocked 
          ? 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700'
          : 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700'
      }`}>
        <div className="text-center">
          <p className={`font-semibold ${
            isAllLocked
              ? 'text-red-800 dark:text-red-300'
              : 'text-green-800 dark:text-green-300'
          }`}>
            {isAllLocked ? 'All weeks locked' : 'No lock times set - all picks available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4 mb-6">
      <div className="text-center">
        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
          Week {nextLockWeek} locks in
        </p>
        <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
          {timeLeft}
        </p>
      </div>
    </div>
  );
}
