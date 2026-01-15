import { config } from 'dotenv';
import { resolve } from 'path';
import { eq, and, inArray } from 'drizzle-orm';

// Load environment variables FIRST
const result = config({ path: resolve(process.cwd(), '.env.local') });
if (result.error) {
  console.error('Error loading .env.local:', result.error);
  process.exit(1);
}

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL not found in environment variables');
  process.exit(1);
}

type FantasyStatLine = {
  passingYards: number;
  passingTDs: number;
  passing2PtConversions: number;
  rushingYards: number;
  rushingTDs: number;
  rushing2PtConversions: number;
  receivingYards: number;
  receivingTDs: number;
  receiving2PtConversions: number;
};

function mapExistingStats(row?: any): FantasyStatLine {
  return {
    passingYards: row?.passingYards ?? 0,
    passingTDs: row?.passingTDs ?? 0,
    passing2PtConversions: row?.passing2PtConversions ?? 0,
    rushingYards: row?.rushingYards ?? 0,
    rushingTDs: row?.rushingTDs ?? 0,
    rushing2PtConversions: row?.rushing2PtConversions ?? 0,
    receivingYards: row?.receivingYards ?? 0,
    receivingTDs: row?.receivingTDs ?? 0,
    receiving2PtConversions: row?.receiving2PtConversions ?? 0,
  };
}

// Helper function to calculate yardage points (handles negatives correctly)
function calculateYardagePoints(yards: number, divisor: number): number {
  if (yards >= 0) {
    return Math.floor(yards / divisor);
  } else {
    // For negative yards: -1 to -9 = 0, -10 to -19 = -1, etc.
    return Math.ceil(yards / divisor);
  }
}

// Scoring rules
function calculateFantasyPoints(stats: FantasyStatLine): number {
  let points = 0;
  
  // Passing: 1 pt per 25 yards (no fractional), 4 pts per TD, 1 pt per 2pt conversion
  points += calculateYardagePoints(stats.passingYards, 25);
  points += stats.passingTDs * 4;
  points += stats.passing2PtConversions * 1;
  
  // Rushing: 1 pt per 10 yards (no fractional), 6 pts per TD, 2 pts per 2pt conversion
  points += calculateYardagePoints(stats.rushingYards, 10);
  points += stats.rushingTDs * 6;
  points += stats.rushing2PtConversions * 2;
  
  // Receiving: 1 pt per 10 yards (no fractional), 6 pts per TD, 2 pts per 2pt conversion
  points += calculateYardagePoints(stats.receivingYards, 10);
  points += stats.receivingTDs * 6;
  points += stats.receiving2PtConversions * 2;
  
  return points;
}

// Calculate team spread points
function calculateTeamSpreadPoints(
  pickedTeam: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  pickedSpread: number
): number {
  const isHome = pickedTeam === homeTeam;
  const teamScore = isHome ? homeScore : awayScore;
  const opponentScore = isHome ? awayScore : homeScore;
  
  // Calculate margin with spread
  const adjustedMargin = teamScore - opponentScore + pickedSpread;
  
  if (adjustedMargin > 0) {
    return 4; // Beat the spread
  } else if (adjustedMargin === 0) {
    return 2; // Push
  } else {
    return 0; // Lost against the spread
  }
}

async function updateWeek1Stats() {
  console.log('Starting Week 1 stats update...\n');
  
  // Import db AFTER env vars are loaded
  const { db } = await import('../app/lib/db');
  const { games, playerGameStats, rosterEntries, players } = await import('../app/lib/db/schema');
  
  const seasonId = 1;
  const week = 1;
  
  try {
    // Get all games for this week
    const weekGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.seasonId, seasonId),
        eq(games.week, week)
      ));
    
    console.log(`Found ${weekGames.length} games for Week ${week}\n`);
    
    let gamesProcessed = 0;
    let updatedPlayers = 0;
    let updatedTeams = 0;
    const errors: string[] = [];
    
    for (const game of weekGames) {
      if (!game.espnGameId) {
        console.log(`⚠️  Skipping game ${game.id}: No ESPN Game ID`);
        errors.push(`Game ${game.id} has no ESPN Game ID`);
        continue;
      }
      
      console.log(`Processing: ${game.awayTeam} @ ${game.homeTeam} (ESPN ID: ${game.espnGameId})`);
      
      // Fetch game data from ESPN
      const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${game.espnGameId}`;
      
      try {
        const response = await fetch(espnUrl);
        if (!response.ok) {
          throw new Error(`ESPN API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract scores
        const homeScore = data.boxscore?.teams?.[1]?.statistics?.find((s: any) => s.name === 'totalPoints')?.displayValue;
        const awayScore = data.boxscore?.teams?.[0]?.statistics?.find((s: any) => s.name === 'totalPoints')?.displayValue;
        
        if (homeScore !== undefined && awayScore !== undefined) {
          // Update game scores
          await db
            .update(games)
            .set({
              homeScore: parseInt(homeScore),
              awayScore: parseInt(awayScore),
              status: data.header?.competitions?.[0]?.status?.type?.name || 'unknown',
            })
            .where(eq(games.id, game.id));
          
          console.log(`  Updated game scores: ${awayScore}-${homeScore}`);
        }
        
        // First, parse 2pt conversions from scoring plays (not in boxscore stats)
        const twoPointConversions = new Map<string, { passing: number, rushing: number, receiving: number }>();
        
        if (data.scoringPlays) {
          for (const play of data.scoringPlays) {
            const playText = play.text || '';
            
            // Look for 2pt conversion patterns
            if (playText.includes('Two-Point Conversion')) {
              // Pattern: "PlayerName Pass to ReceiverName for Two-Point Conversion"
              // Pattern: "PlayerName Rush for Two-Point Conversion"
              
              // Passing 2pt: "PlayerName Pass to ReceiverName for Two-Point Conversion"
              const passingMatch = playText.match(/([A-Za-z\.\s]+)\s+Pass\s+to\s+([A-Za-z\.\s]+)\s+for\s+Two-Point Conversion/i);
              if (passingMatch) {
                const passer = passingMatch[1].trim();
                const receiver = passingMatch[2].trim();
                
                const passerStats = twoPointConversions.get(passer) || { passing: 0, rushing: 0, receiving: 0 };
                passerStats.passing++;
                twoPointConversions.set(passer, passerStats);
                
                const receiverStats = twoPointConversions.get(receiver) || { passing: 0, rushing: 0, receiving: 0 };
                receiverStats.receiving++;
                twoPointConversions.set(receiver, receiverStats);
              }
              
              // Rushing 2pt: "PlayerName Rush for Two-Point Conversion"
              const rushingMatch = playText.match(/([A-Za-z\.\s]+)\s+Rush\s+for\s+Two-Point Conversion/i);
              if (rushingMatch) {
                const rusher = rushingMatch[1].trim();
                const rusherStats = twoPointConversions.get(rusher) || { passing: 0, rushing: 0, receiving: 0 };
                rusherStats.rushing++;
                twoPointConversions.set(rusher, rusherStats);
              }
            }
          }
        }
        
        // Process player stats from boxscore
        const teams = data.boxscore?.players || [];
        
        for (const team of teams) {
          const teamAbbr = team.team?.abbreviation;
          const statGroups = team.statistics || [];
          
          for (const statGroup of statGroups) {
            const categoryName = statGroup.name; // e.g., "passing", "rushing", "receiving"
            const athletes = statGroup.athletes || [];
            
            for (const athlete of athletes) {
              const playerName = athlete.athlete?.displayName;
              const stats = athlete.stats || [];
              
              if (!playerName || stats.length === 0) continue;
              
              // Find player in our database
              const [dbPlayer] = await db
                .select()
                .from(players)
                .where(eq(players.name, playerName))
                .limit(1);
              
              if (!dbPlayer) {
                console.log(`  ⚠️  Player not found in database: ${playerName}`);
                continue;
              }
              
              // Parse stats based on category
              let playerStats: FantasyStatLine = mapExistingStats();
              
              // Get existing stats for this player/game if any
              const [existing] = await db
                .select()
                .from(playerGameStats)
                .where(and(
                  eq(playerGameStats.playerId, dbPlayer.id),
                  eq(playerGameStats.gameId, game.id)
                ))
                .limit(1);
              
              if (existing) {
                playerStats = mapExistingStats(existing);
              }
              
              // Update stats based on category
              // Passing Labels: C/ATT, YDS, AVG, TD, INT, SACKS, QBR, RTG
              // Rushing Labels: CAR, YDS, AVG, TD, LONG
              // Receiving Labels: REC, YDS, AVG, TD, LONG
              if (categoryName === 'passing' && stats.length >= 3) {
                playerStats.passingYards = parseInt(stats[1]) || 0; // Index 1 = YDS
                playerStats.passingTDs = parseInt(stats[3]) || 0; // Index 3 = TD
              } else if (categoryName === 'rushing' && stats.length >= 3) {
                playerStats.rushingYards = parseInt(stats[1]) || 0; // Index 1 = YDS
                playerStats.rushingTDs = parseInt(stats[3]) || 0; // Index 3 = TD
              } else if (categoryName === 'receiving' && stats.length >= 3) {
                playerStats.receivingYards = parseInt(stats[1]) || 0; // Index 1 = YDS
                playerStats.receivingTDs = parseInt(stats[3]) || 0; // Index 3 = TD
              }
              
              // Apply 2pt conversions from scoring plays
              const twoPointers = twoPointConversions.get(playerName);
              if (twoPointers) {
                playerStats.passing2PtConversions = twoPointers.passing;
                playerStats.rushing2PtConversions = twoPointers.rushing;
                playerStats.receiving2PtConversions = twoPointers.receiving;
              }
              
              // Calculate fantasy points
              const fantasyPoints = calculateFantasyPoints(playerStats);
              
              // Upsert player game stats
              if (existing) {
                await db
                  .update(playerGameStats)
                  .set({ ...playerStats, fantasyPoints })
                  .where(eq(playerGameStats.id, existing.id));
              } else {
                await db.insert(playerGameStats).values({
                  playerId: dbPlayer.id,
                  gameId: game.id,
                  seasonId,
                  week,
                  ...playerStats,
                  fantasyPoints,
                });
              }
              
              // Update roster entries for this player
              const rosterEntriesForPlayer = await db
                .select()
                .from(rosterEntries)
                .where(and(
                  eq(rosterEntries.playerId, dbPlayer.id),
                  eq(rosterEntries.seasonId, seasonId),
                  eq(rosterEntries.week, week)
                ));
              
              for (const entry of rosterEntriesForPlayer) {
                await db
                  .update(rosterEntries)
                  .set({ fantasyPoints })
                  .where(eq(rosterEntries.id, entry.id));
              }
              
              if (rosterEntriesForPlayer.length > 0) {
                console.log(`  ✓ ${playerName}: ${fantasyPoints} pts (${rosterEntriesForPlayer.length} entries)`);
                updatedPlayers++;
              }
            }
          }
        }
        
        // Update team picks
        if (homeScore !== undefined && awayScore !== undefined) {
          const teamEntries = await db
            .select()
            .from(rosterEntries)
            .where(and(
              eq(rosterEntries.gameId, game.id),
              eq(rosterEntries.seasonId, seasonId),
              eq(rosterEntries.week, week),
              eq(rosterEntries.position, 'TEAM')
            ));
          
          for (const entry of teamEntries) {
            if (entry.pickedTeam && entry.pickedSpread !== null) {
              const teamPoints = calculateTeamSpreadPoints(
                entry.pickedTeam,
                game.homeTeam,
                game.awayTeam,
                parseInt(homeScore),
                parseInt(awayScore),
                entry.pickedSpread
              );
              
              await db
                .update(rosterEntries)
                .set({ fantasyPoints: teamPoints })
                .where(eq(rosterEntries.id, entry.id));
              
              console.log(`  ✓ Team ${entry.pickedTeam}: ${teamPoints} pts`);
              updatedTeams++;
            }
          }
        }
        
        gamesProcessed++;
        console.log('');
        
      } catch (error) {
        const errMsg = `Failed to process game ${game.espnGameId}: ${error}`;
        console.error(`  ❌ ${errMsg}`);
        errors.push(errMsg);
      }
    }
    
    console.log('\n=== STATS UPDATE COMPLETE ===');
    console.log(`Games processed: ${gamesProcessed}/${weekGames.length}`);
    console.log(`Player entries updated: ${updatedPlayers}`);
    console.log(`Team entries updated: ${updatedTeams}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Errors: ${errors.length}`);
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
  } catch (error) {
    console.error('Failed to update stats:', error);
    throw error;
  }
}

updateWeek1Stats().catch(console.error);
