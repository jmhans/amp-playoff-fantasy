async function checkCalebWilliams2pt() {
  const gameId = 401772981; // GB @ CHI from Week 1
  
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`;
  console.log(`Fetching: ${url}\n`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  // Find Caleb Williams in boxscore
  const teams = data.boxscore.players;
  
  for (const team of teams) {
    console.log(`\n${team.team.displayName}:`);
    
    // Look at ALL stat categories
    for (const statGroup of team.statistics) {
      const categoryName = statGroup.name;
      
      for (const athlete of statGroup.athletes) {
        if (athlete.athlete.displayName === 'Caleb Williams') {
          console.log(`\n  Category: ${categoryName}`);
          console.log(`  Labels:`, statGroup.labels.join(', '));
          console.log(`  Stats:`, athlete.stats);
        }
      }
    }
  }
  
  // Also check if there's a separate section for 2pt conversions
  console.log('\n\nChecking for other data structures...');
  if (data.scoringPlays) {
    console.log('\nScoring Plays found:');
    for (const play of data.scoringPlays) {
      if (play.text && play.text.includes('Caleb Williams')) {
        console.log(`  - ${play.text}`);
        console.log(`    Type: ${play.type?.text || 'unknown'}`);
        console.log(`    Full play:`, JSON.stringify(play, null, 2));
      }
    }
  }
}

checkCalebWilliams2pt();
