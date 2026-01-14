// Quick script to check ESPN stats format
async function checkESPNStatsFormat() {
  // Bills vs Broncos wild card game (Week 1) - Josh Allen's game  
  const espnGameId = '401671760'; // BUF @ DEN
  
  console.log(`Fetching game ${espnGameId}...\n`);
  
  const response = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${espnGameId}`
  );
  
  if (!response.ok) {
    console.error(`Failed to fetch: ${response.status}`);
    return;
  }
  
  const data = await response.json();
  const boxscore = data.boxscore;
  
  if (!boxscore?.players) {
    console.log('No player data found');
    return;
  }
  
  console.log('=== CHECKING ESPN STATS FORMAT ===\n');
  
  for (const teamStats of boxscore.players) {
    const teamAbbrev = teamStats.team.abbreviation;
    console.log(`\nTeam: ${teamAbbrev}`);
    
    for (const statCategory of teamStats.statistics) {
      const categoryName = statCategory.name;
      console.log(`\n  Category: ${categoryName}`);
      console.log(`  Labels: ${statCategory.labels?.join(', ')}`);
      
      for (const athlete of statCategory.athletes) {
        const athleteName = athlete.athlete.displayName;
        const stats = athlete.stats || [];
        
        // Only show Josh Allen for passing
        if (categoryName === 'passing' && athleteName === 'Josh Allen') {
          console.log(`\n    Player: ${athleteName}`);
          console.log(`    Stats array:`, stats);
          console.log(`    Stats length: ${stats.length}`);
          stats.forEach((stat, idx) => {
            console.log(`      [${idx}]: ${stat}`);
          });
        }
      }
    }
  }
}

checkESPNStatsFormat().catch(console.error);
