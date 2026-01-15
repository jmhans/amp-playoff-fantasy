'use client';

import { useState } from 'react';

interface AdminToggleProps {
  userIsAdmin: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function AdminToggle({ userIsAdmin, onToggle }: AdminToggleProps) {
  const [adminModeEnabled, setAdminModeEnabled] = useState(false);

  if (!userIsAdmin) {
    return null;
  }

  const handleToggle = () => {
    const newValue = !adminModeEnabled;
    setAdminModeEnabled(newValue);
    onToggle(newValue);
  };

  return (
    <div className="mb-4 rounded-lg border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div>
            <div className="font-semibold text-purple-900 dark:text-purple-100">
              Admin Mode
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300">
              {adminModeEnabled 
                ? 'Edit all picks, bypass lock times' 
                : 'View as regular user'}
            </div>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
            adminModeEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              adminModeEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
