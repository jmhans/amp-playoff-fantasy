import { db } from '@/app/lib/db';
import { games, rosterEntries, playerGameStats } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

async function debugWeek3() {
  try {
    console.log('=== Debugging Week 3 ===\n');

    // Check games
    const week3Games = await db
      .select()
      .from(games)
      .where(eq(games.week, 3));

    console.log(`Games for week 3: ${week3Games.length}`);
    week3Games.forEach(g => {
      console.log(`  - ${g.awayTeam} @ ${g.homeTeam}`);
      console.log(`    ESPN ID: ${g.espnGameId}`);
      console.log(`    Status: ${g.status}`);
      console.log(`    Score: ${g.awayScore}-${g.homeScore}`);
    });

    // Check roster entries
    const week3Rosters = await db
      .select()
      .from(rosterEntries)
      .where(eq(rosterEntries.week, 3));

    console.log(`\nRoster entries for week 3: ${week3Rosters.length}`);
    const positionCounts: { [key: string]: number } = {};
    week3Rosters.forEach(r => {
      positionCounts[r.position] = (positionCounts[r.position] || 0) + 1;
    });
    Object.entries(positionCounts).forEach(([pos, count]) => {
      console.log(`  - ${pos}: ${count}`);
    });

    // Check player game stats
    const week3Stats = await db
      .select()
      .from(playerGameStats)
      .where(eq(playerGameStats.week, 3));

    console.log(`\nPlayer game stats for week 3: ${week3Stats.length}`);

    // Check for nulls/issues
    console.log('\n=== Checking for issues ===');
    
    const gamesWithoutEspnId = week3Games.filter(g => !g.espnGameId);
    if (gamesWithoutEspnId.length > 0) {
      console.log(`❌ Games without ESPN ID: ${gamesWithoutEspnId.length}`);
    }

    const rostersWithoutStats = await db
      .select({ 
        id: rosterEntries.id,
        playerName: rosterEntries.playerName,
        week: rosterEntries.week,
        position: rosterEntries.position,
        fantasyPoints: rosterEntries.fantasyPoints
      })
      .from(rosterEntries)
      .where(eq(rosterEntries.week, 3));

    const rostersWithZeroPoints = rostersWithoutStats.filter(r => r.fantasyPoints === 0 || r.fantasyPoints === null);
    if (rostersWithZeroPoints.length > 0) {
      console.log(`❌ Roster entries with 0/null fantasy points: ${rostersWithZeroPoints.length}`);
      console.log(`   First 5:`);
      rostersWithZeroPoints.slice(0, 5).forEach(r => {
        console.log(`   - ${r.playerName} (${r.position}): ${r.fantasyPoints || 'null'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugWeek3();
