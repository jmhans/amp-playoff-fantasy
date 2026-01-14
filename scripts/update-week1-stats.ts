import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

async function updateStats() {
  console.log('Triggering Week 1 stats update...\n');
  
  const seasonId = 1;
  const week = 1;
  
  // Make a request to the stats update API endpoint (dev server must be running)
  const baseUrl = 'http://localhost:3000';
  const url = `${baseUrl}/api/stats/update`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ seasonId, week }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    
    console.log('✓ Stats update completed!\n');
    console.log(`Games processed: ${result.gamesProcessed}`);
    console.log(`Players updated: ${result.updatedPlayers}`);
    console.log(`Teams updated: ${result.updatedTeams}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach((err: string) => console.log(`  - ${err}`));
    }
  } catch (error) {
    console.error('Failed to update stats:', error);
    throw error;
  }
}

updateStats().catch(console.error);
