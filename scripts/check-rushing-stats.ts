async function checkRushingStats() {
  const gameId = 401772977; // BUF @ JAX from Week 1
  
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`;
  console.log(`Fetching: ${url}\n`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  // Find Josh Allen in boxscore
  const teams = data.boxscore.players;
  
  for (const team of teams) {
    console.log(`\n${team.team.displayName}:`);
    for (const statGroup of team.statistics) {
      if (statGroup.name === 'rushing') {
        console.log('\nRushing Stats:');
        console.log('Labels:', statGroup.labels.join(', '));
        
        for (const athlete of statGroup.athletes) {
          if (athlete.athlete.displayName === 'Josh Allen') {
            console.log(`\nJosh Allen:`);
            console.log('Stats array:', athlete.stats);
            console.log(`Index [0]: ${athlete.stats[0]}`);
            console.log(`Index [1]: ${athlete.stats[1]}`);
            console.log(`Index [2]: ${athlete.stats[2]}`);
            console.log(`Index [3]: ${athlete.stats[3]}`);
            console.log(`Index [4]: ${athlete.stats[4]}`);
          }
        }
      }
    }
  }
}

checkRushingStats();
