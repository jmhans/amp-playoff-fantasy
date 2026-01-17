'use client';

import { useState } from 'react';
import { lusitana } from '@/app/ui/fonts';

export default function ProjectionsManualUpload() {
  const [projectionsText, setProjectionsText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    setUploading(true);
    setMessage('');

    try {
      // Parse CSV or JSON input
      // Expected CSV format: PlayerName,Team,Position,ProjectedPoints
      // Or JSON: [{"name": "Patrick Mahomes", "team": "KC", "position": "QB", "projected": 24.5}]
      
      const response = await fetch('/api/projections/manual-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: projectionsText }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ Successfully updated ${result.updated} players. ${result.notFound} not found.`);
        setProjectionsText('');
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-600 p-4 mb-8">
        <h1 className={`${lusitana.className} text-white text-3xl md:text-5xl`}>
          Manual Projections Upload
        </h1>
      </div>

      <div className="max-w-4xl">
        <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Instructions</h2>
          <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
            <li>• Get projections from FantasyPros, RotoBaller, or NumberFire</li>
            <li>• Paste CSV format: <code>PlayerName,Team,Position,ProjectedPoints</code></li>
            <li>• Or JSON format: <code>{'[{"name":"Patrick Mahomes","team":"KC","position":"QB","projected":24.5}]'}</code></li>
            <li>• Click Upload to update player projections</li>
          </ul>
        </div>

        <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white mb-4">Projection Data</h2>
          <textarea
            value={projectionsText}
            onChange={(e) => setProjectionsText(e.target.value)}
            placeholder="Paste projection data here (CSV or JSON format)..."
            className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm dark:bg-gray-700 dark:text-white"
            disabled={uploading}
          />
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleUpload}
            disabled={uploading || !projectionsText.trim()}
            className="w-full rounded-lg bg-blue-600 dark:bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading Projections...' : 'Upload Projections'}
          </button>

          {message && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap dark:text-white">{message}</pre>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
          <h2 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">💡 Alternative: Auto-Calculate</h2>
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            Or use <a href="/api/projections/calculate" className="underline">automated calculation</a> based on 2024 regular season averages.
          </p>
        </div>
      </div>
    </main>
  );
}
