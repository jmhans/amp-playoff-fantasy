'use client';

import { useState } from 'react';
import PicksGrid from './PicksGrid';
import CountdownTimer from './CountdownTimer';
import HidePicksToggle from './HidePicksToggle';
import AdminToggle from './AdminToggle';

interface PicksClientWrapperProps {
  participantId: number;
  participantName: string;
  seasonId: number;
  canEdit: boolean;
  isOwner: boolean;
  userIsAdmin: boolean;
  lockTimes: Array<{ week: number; lockTime: string | Date | null }>;
  hidePicksUntilLock: boolean;
}

export default function PicksClientWrapper({
  participantId,
  participantName,
  seasonId,
  canEdit,
  isOwner,
  userIsAdmin,
  lockTimes,
  hidePicksUntilLock,
}: PicksClientWrapperProps) {
  const [adminModeEnabled, setAdminModeEnabled] = useState(false);

  return (
    <>
      {!canEdit && (
        <div className="mb-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-200">
          You are viewing this roster in read-only mode.
        </div>
      )}

      <AdminToggle 
        userIsAdmin={userIsAdmin} 
        onToggle={setAdminModeEnabled} 
      />

      {adminModeEnabled && !isOwner && (
        <div className="mb-4 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-200">
          ⚡ Admin mode active - You can edit this roster regardless of lock times.
        </div>
      )}

      <CountdownTimer lockTimes={lockTimes} />

      {isOwner && (
        <HidePicksToggle 
          participantId={participantId} 
          initialValue={hidePicksUntilLock}
        />
      )}

      <PicksGrid 
        participantId={participantId} 
        seasonId={seasonId} 
        isOwner={canEdit} 
        lockTimes={lockTimes} 
        isAdmin={adminModeEnabled}
        hidePicksUntilLock={hidePicksUntilLock}
        viewingAsOwner={isOwner}
      />
    </>
  );
}
