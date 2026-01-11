'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export default function DebugPage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <p>Not logged in</p>
        <a href="/api/auth/login" className="text-blue-600">Login</a>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-600 mb-4 inline-block">← Back</Link>
      <h1 className="text-2xl font-bold mb-4">User Debug Info</h1>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}
