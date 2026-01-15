'use client';

import { useState } from 'react';
import { toggleHidePicksUntilLock } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';

interface Props {
  participantId: number;
  initialValue: boolean;
}

export default function HidePicksToggle({ participantId, initialValue }: Props) {
  const [isHidden, setIsHidden] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsSaving(true);
    const newValue = !isHidden;
    
    try {
      const result = await toggleHidePicksUntilLock(participantId, newValue);
      
      if (result.success) {
        setIsHidden(newValue);
        router.refresh();
      } else {
        alert(result.error || 'Failed to update setting');
      }
    } catch (error) {
      alert('An error occurred while updating the setting');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <svg 
          className="w-5 h-5 text-gray-600 dark:text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isHidden ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          )}
        </svg>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Hide my picks from others until lock time
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isHidden ? 'Your unlocked picks are hidden from other users' : 'Your picks are visible to all users'}
          </p>
        </div>
      </div>
      
      <button
        onClick={handleToggle}
        disabled={isSaving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
          isHidden ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        aria-label="Toggle hide picks"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isHidden ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
