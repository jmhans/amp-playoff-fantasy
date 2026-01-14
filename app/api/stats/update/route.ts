import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { games, playerGameStats, rosterEntries, players } from '@/app/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Scoring rules
function calculateFantasyPoints(stats: {
  passingYards: number;
  passingTDs: number;
  passing2PtConversions: number;
  rushingYards: number;
  rushingTDs: number;
  rushing2PtConversions: number;
  receivingYards: number;
  receivingTDs: number;
  receiving2PtConversions: number;
}): number {
  let points = 0;
  
  // Passing: 1 pt per 25 yards (no fractional), 4 pts per TD, 1 pt per 2pt conversion
  points += Math.floor(stats.passingYards / 25);
  points += stats.passingTDs * 4;
  points += stats.passing2PtConversions * 1;
  
  // Rushing: 1 pt per 10 yards (no fractional), 6 pts per TD, 2 pts per 2pt conversion
  points += Math.floor(stats.rushingYards / 10);
  points += stats.rushingTDs * 6;
  points += stats.rushing2PtConversions * 2;
  
  // Receiving: 1 pt per 10 yards (no fractional), 6 pts per TD, 2 pts per 2pt conversion
  points += Math.floor(stats.receivingYards / 10);
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
  
  // Adjust score by spread (positive spread = favored)
  const adjustedMargin = teamScore - opponentScore + pickedSpread;
  
  if (adjustedMargin > 0) {
    return 4; // Beat the spread
  } else if (adjustedMargin === 0) {
    return 2; // Push
  } else {
    return 0; // Lost against spread
  }
}

export async function POST(request: NextRequest) {
  try {
    const { seasonId, week } = await request.json();
    
    if (!seasonId || !week) {
      return NextResponse.json({ error: 'Missing seasonId or week' }, { status: 400 });
    }

    // Get games for this week
    const weekGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.seasonId, seasonId),
        eq(games.week, week)
      ));

    if (weekGames.length === 0) {
      return NextResponse.json({ error: 'No games found' }, { status: 404 });
    }

    let updatedPlayers = 0;
    let updatedTeams = 0;

    // Process each game
    for (const game of weekGames) {
      if (!game.espnGameId) continue;

      // Fetch game data from ESPN
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${game.espnGameId}`
      );

      if (!response.ok) {
        console.error(`Failed to fetch game ${game.espnGameId}`);
        continue;
      }

      const gameData = await response.json();
      const boxscore = gameData.boxscore;
      const header = gameData.header;
      const competition = header?.competitions?.[0];

      // Update game status and scores
      if (competition) {
        const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === 'home');
        const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === 'away');
        
        await db
          .update(games)
          .set({
            status: competition.status?.type?.name,
            homeScore: parseInt(homeCompetitor?.score || '0'),
            awayScore: parseInt(awayCompetitor?.score || '0'),
            updatedAt: new Date(),
          })
          .where(eq(games.id, game.id));
      }

      // First, parse 2pt conversions from scoring plays (not in boxscore stats)
      const twoPointConversions = new Map<string, { passing: number, rushing: number, receiving: number }>();
      
      if (gameData.scoringPlays) {
        for (const play of gameData.scoringPlays) {
          const playText = play.text || '';
          
          // Look for 2pt conversion patterns
          if (playText.includes('Two-Point Conversion')) {
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

      // Process player stats
      if (boxscore?.players) {
        for (const teamStats of boxscore.players) {
          const teamAbbrev = teamStats.team.abbreviation;
          
          for (const statCategory of teamStats.statistics) {
            const categoryName = statCategory.name; // e.g., 'passing', 'rushing', 'receiving'
            
            for (const athlete of statCategory.athletes) {
              const espnPlayerId = athlete.athlete.id;
              const athleteName = athlete.athlete.displayName;
              
              // Find or create player in our database
              let player = await db
                .select()
                .from(players)
                .where(eq(players.espnId, espnPlayerId))
                .limit(1);

              let playerId = player[0]?.id;

              if (!playerId) {
                // Player doesn't exist, create them
                const newPlayer = await db
                  .insert(players)
                  .values({
                    name: athleteName,
                    team: teamAbbrev,
                    position: athlete.athlete.position?.abbreviation || 'UNK',
                    espnId: espnPlayerId,
                  })
                  .returning();
                playerId = newPlayer[0].id;
              }

              // Get existing stats or create new record
              let existingStats = await db
                .select()
                .from(playerGameStats)
                .where(and(
                  eq(playerGameStats.gameId, game.id),
                  eq(playerGameStats.espnPlayerId, espnPlayerId)
                ))
                .limit(1);

              const statsData = {
                passingYards: 0,
                passingTDs: 0,
                passing2PtConversions: 0,
                rushingYards: 0,
                rushingTDs: 0,
                rushing2PtConversions: 0,
                receivingYards: 0,
                receivingTDs: 0,
                receiving2PtConversions: 0,
              };

              if (existingStats[0]) {
                statsData.passingYards = existingStats[0].passingYards || 0;
                statsData.passingTDs = existingStats[0].passingTDs || 0;
                statsData.passing2PtConversions = existingStats[0].passing2PtConversions || 0;
                statsData.rushingYards = existingStats[0].rushingYards || 0;
                statsData.rushingTDs = existingStats[0].rushingTDs || 0;
                statsData.rushing2PtConversions = existingStats[0].rushing2PtConversions || 0;
                statsData.receivingYards = existingStats[0].receivingYards || 0;
                statsData.receivingTDs = existingStats[0].receivingTDs || 0;
                statsData.receiving2PtConversions = existingStats[0].receiving2PtConversions || 0;
              }

              // Parse stats based on category
              // Passing Labels: C/ATT, YDS, AVG, TD, INT, SACKS, QBR, RTG
              // Rushing Labels: CAR, YDS, AVG, TD, LONG
              // Receiving Labels: REC, YDS, AVG, TD, LONG
              const stats = athlete.stats || [];
              if (categoryName === 'passing') {
                statsData.passingYards = parseInt(stats[1] || '0'); // Index 1 = YDS
                statsData.passingTDs = parseInt(stats[3] || '0'); // Index 3 = TD
              } else if (categoryName === 'rushing') {
                statsData.rushingYards = parseInt(stats[1] || '0'); // Index 1 = YDS
                statsData.rushingTDs = parseInt(stats[3] || '0'); // Index 3 = TD
              } else if (categoryName === 'receiving') {
                statsData.receivingYards = parseInt(stats[1] || '0'); // Index 1 = YDS
                statsData.receivingTDs = parseInt(stats[3] || '0'); // Index 3 = TD
              }

              // Apply 2pt conversions from scoring plays
              const twoPointers = twoPointConversions.get(athleteName);
              if (twoPointers) {
                statsData.passing2PtConversions = twoPointers.passing;
                statsData.rushing2PtConversions = twoPointers.rushing;
                statsData.receiving2PtConversions = twoPointers.receiving;
              }

              // Calculate fantasy points
              const fantasyPoints = calculateFantasyPoints(statsData);

              // Upsert player game stats
              if (existingStats[0]) {
                await db
                  .update(playerGameStats)
                  .set({
                    ...statsData,
                    fantasyPoints,
                    updatedAt: new Date(),
                  })
                  .where(eq(playerGameStats.id, existingStats[0].id));
              } else {
                await db.insert(playerGameStats).values({
                  playerId,
                  espnPlayerId,
                  gameId: game.id,
                  seasonId,
                  week,
                  ...statsData,
                  fantasyPoints,
                });
              }

              updatedPlayers++;
            }
          }
        }
      }
    }

    // Update roster entry fantasy points for players
    const weekGamesIds = weekGames.map(g => g.id);
    const entriesWithPlayers = await db
      .select()
      .from(rosterEntries)
      .where(and(
        eq(rosterEntries.seasonId, seasonId),
        eq(rosterEntries.week, week),
        inArray(rosterEntries.position, ['QB', 'RB', 'WR', 'FLEX'])
      ));

    for (const entry of entriesWithPlayers) {
      if (!entry.playerId) continue;

      // Find player's game this week
      const player = await db
        .select()
        .from(players)
        .where(eq(players.id, entry.playerId))
        .limit(1);

      if (!player[0]?.espnId) continue;

      // Find their stats
      const stats = await db
        .select()
        .from(playerGameStats)
        .where(and(
          eq(playerGameStats.espnPlayerId, player[0].espnId),
          eq(playerGameStats.week, week),
          eq(playerGameStats.seasonId, seasonId)
        ))
        .limit(1);

      if (stats[0]) {
        await db
          .update(rosterEntries)
          .set({
            fantasyPoints: stats[0].fantasyPoints,
            updatedAt: new Date(),
          })
          .where(eq(rosterEntries.id, entry.id));
      }
    }

    // Update roster entry fantasy points for teams
    const entriesWithTeams = await db
      .select()
      .from(rosterEntries)
      .where(and(
        eq(rosterEntries.seasonId, seasonId),
        eq(rosterEntries.week, week),
        eq(rosterEntries.position, 'TEAM')
      ));

    for (const entry of entriesWithTeams) {
      if (!entry.gameId || !entry.pickedTeam || entry.pickedSpread === null) continue;

      const game = weekGames.find(g => g.id === entry.gameId);
      if (!game || game.homeScore === null || game.awayScore === null) continue;

      const teamPoints = calculateTeamSpreadPoints(
        entry.pickedTeam,
        game.homeTeam,
        game.awayTeam,
        game.homeScore,
        game.awayScore,
        entry.pickedSpread
      );

      await db
        .update(rosterEntries)
        .set({
          fantasyPoints: teamPoints,
          updatedAt: new Date(),
        })
        .where(eq(rosterEntries.id, entry.id));

      updatedTeams++;
    }

    return NextResponse.json({
      success: true,
      updatedPlayers,
      updatedTeams,
      gamesProcessed: weekGames.length,
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    return NextResponse.json(
      { error: 'Failed to update stats' },
      { status: 500 }
    );
  }
}
