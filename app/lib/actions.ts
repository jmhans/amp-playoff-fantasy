'use server';

import { db } from '@/app/lib/db';
import { participants, rosterEntries, seasons, players, playerGameStats, games } from '@/app/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getOrCreateActiveSeason() {
  try {
    // Try to find an active season
    const activeSeason = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);
    
    if (activeSeason.length > 0) {
      return activeSeason[0];
    }
    
    // No active season, create one for 2025
    const newSeason = await db
      .insert(seasons)
      .values({
        year: 2025,
        name: '2025 Playoffs',
        isActive: true,
      })
      .returning();
    
    return newSeason[0];
  } catch (error) {
    console.error('Failed to get or create active season:', error);
    throw error;
  }
}

export async function getParticipants() {
  try {
    return await db.select().from(participants);
  } catch (error) {
    console.error('Failed to fetch participants:', error);
    throw new Error('Failed to fetch participants');
  }
}

export async function getParticipantById(id: number) {
  try {
    const result = await db
      .select()
      .from(participants)
      .where(eq(participants.id, id))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch participant:', error);
    return null;
  }
}

export async function getParticipantByAuth0Id(auth0Id: string) {
  try {
    const result = await db
      .select()
      .from(participants)
      .where(eq(participants.auth0Id, auth0Id))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch participant:', error);
    throw new Error('Failed to fetch participant');
  }
}

export async function getParticipantsByAuth0Id(auth0Id: string) {
  try {
    return await db
      .select()
      .from(participants)
      .where(eq(participants.auth0Id, auth0Id));
  } catch (error) {
    console.error('Failed to fetch participants:', error);
    return [];
  }
}

export async function claimParticipantAccount(participantId: number, auth0Id: string) {
  try {
    // Check if this specific participant is already claimed by someone
    const participant = await db
      .select()
      .from(participants)
      .where(eq(participants.id, participantId))
      .limit(1);

    if (participant.length === 0) {
      return { success: false, error: 'Participant not found' };
    }

    if (participant[0].auth0Id) {
      return { success: false, error: 'This participant has already been claimed' };
    }

    // Update the participant
    await db
      .update(participants)
      .set({ auth0Id })
      .where(eq(participants.id, participantId));

    return { success: true };
  } catch (error) {
    console.error('Failed to claim account:', error);
    return { success: false, error: 'Failed to claim account' };
  }
}

export async function toggleHidePicksUntilLock(participantId: number, hidePicksUntilLock: boolean) {
  try {
    await db
      .update(participants)
      .set({ hidePicksUntilLock })
      .where(eq(participants.id, participantId));

    return { success: true };
  } catch (error) {
    console.error('Failed to update hide picks setting:', error);
    return { success: false, error: 'Failed to update setting' };
  }
}

export async function getRosterEntries(participantId: number, seasonId?: number) {
  try {
    const { players } = await import('@/app/lib/db/schema');
    
    // Build where conditions
    const conditions = [eq(rosterEntries.participantId, participantId)];
    if (seasonId !== undefined) {
      conditions.push(eq(rosterEntries.seasonId, seasonId));
    }
    
    const entries = await db
      .select({
        id: rosterEntries.id,
        participantId: rosterEntries.participantId,
        seasonId: rosterEntries.seasonId,
        playerId: rosterEntries.playerId,
        playerName: rosterEntries.playerName,
        position: rosterEntries.position,
        week: rosterEntries.week,
        team: rosterEntries.team,
        gameId: rosterEntries.gameId,
        pickedTeam: rosterEntries.pickedTeam,
        pickedSpread: rosterEntries.pickedSpread,
        fantasyPoints: rosterEntries.fantasyPoints,
        createdAt: rosterEntries.createdAt,
        updatedAt: rosterEntries.updatedAt,
        player: players,
      })
      .from(rosterEntries)
      .leftJoin(players, eq(rosterEntries.playerId, players.id))
      .where(and(...conditions));
    
    return entries;
  } catch (error) {
    console.error('Failed to fetch roster entries:', error);
    return [];
  }
}

export async function getEligiblePlayers(participantId: number, position: string, seasonId: number, week: number) {
  try {
    const { players, games } = await import('@/app/lib/db/schema');
    const { inArray, and } = await import('drizzle-orm');
    
    // Get teams playing this week
    const weekGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.seasonId, seasonId),
        eq(games.week, week)
      ));
    
    const teamsPlaying = new Set<string>();
    weekGames.forEach(game => {
      teamsPlaying.add(game.homeTeam);
      teamsPlaying.add(game.awayTeam);
    });
    
    // If no games scheduled yet, return empty
    if (teamsPlaying.size === 0) {
      return [];
    }
    
    // Get all roster entries for this participant to check what's already used
    const usedEntries = await db
      .select()
      .from(rosterEntries)
      .where(eq(rosterEntries.participantId, participantId));
    
    // Get player IDs that are already used
    const usedPlayerIds = usedEntries
      .filter(entry => entry.playerId)
      .map(entry => entry.playerId as number);
    
    // Define position eligibility
    let eligiblePositions: string[] = [];
    if (position === 'QB') {
      eligiblePositions = ['QB'];
    } else if (position === 'RB') {
      eligiblePositions = ['RB'];
    } else if (position === 'WR') {
      eligiblePositions = ['WR', 'TE'];
    } else if (position === 'FLEX') {
      eligiblePositions = ['RB', 'WR', 'TE'];
    } else if (position === 'TEAM') {
      // TEAM position would need special handling for defense/special teams
      // For now, return empty until we have defense data
      return [];
    }
    
    // Get all players matching eligible positions
    const allPlayers = await db
      .select()
      .from(players)
      .where(inArray(players.position, eligiblePositions));
    
    // Filter players by teams playing this week and exclude already used players
    return allPlayers.filter(p => 
      teamsPlaying.has(p.team) && !usedPlayerIds.includes(p.id)
    );
  } catch (error) {
    console.error('Failed to fetch eligible players:', error);
    return [];
  }
}

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

// Helper to recalculate fantasy points for a specific roster entry
async function recalculateEntryFantasyPoints(entryId: number): Promise<boolean> {
  try {
    const entry = await db
      .select()
      .from(rosterEntries)
      .where(eq(rosterEntries.id, entryId))
      .limit(1);

    if (!entry[0]) return false;

    const rosterEntry = entry[0];

    // Handle TEAM position
    if (rosterEntry.position === 'TEAM') {
      if (!rosterEntry.gameId || !rosterEntry.pickedTeam || rosterEntry.pickedSpread === null) {
        return false;
      }

      const game = await db
        .select()
        .from(games)
        .where(eq(games.id, rosterEntry.gameId))
        .limit(1);

      if (!game[0] || game[0].homeScore === null || game[0].awayScore === null) {
        return false; // Game not completed yet
      }

      const teamPoints = calculateTeamSpreadPoints(
        rosterEntry.pickedTeam,
        game[0].homeTeam,
        game[0].awayTeam,
        game[0].homeScore,
        game[0].awayScore,
        rosterEntry.pickedSpread
      );

      await db
        .update(rosterEntries)
        .set({
          fantasyPoints: teamPoints,
          updatedAt: new Date(),
        })
        .where(eq(rosterEntries.id, entryId));

      return true;
    }

    // Handle player positions
    if (!rosterEntry.playerId) return false;

    const player = await db
      .select()
      .from(players)
      .where(eq(players.id, rosterEntry.playerId))
      .limit(1);

    if (!player[0]?.espnId) return false;

    const stats = await db
      .select()
      .from(playerGameStats)
      .where(and(
        eq(playerGameStats.espnPlayerId, player[0].espnId),
        eq(playerGameStats.week, rosterEntry.week),
        eq(playerGameStats.seasonId, rosterEntry.seasonId)
      ))
      .limit(1);

    if (stats[0]) {
      await db
        .update(rosterEntries)
        .set({
          fantasyPoints: stats[0].fantasyPoints,
          updatedAt: new Date(),
        })
        .where(eq(rosterEntries.id, entryId));

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error recalculating entry fantasy points:', error);
    return false;
  }
}

export async function updateRosterEntry(
  entryId: number, 
  playerId: number | null, 
  playerName: string,
  gameId?: number | null,
  pickedTeam?: string | null,
  pickedSpread?: number | null
) {
  try {
    console.log('updateRosterEntry called:', { entryId, playerId, playerName, gameId, pickedTeam, pickedSpread });
    
    // Get the entry to check if the week is locked
    const existingEntry = await db
      .select()
      .from(rosterEntries)
      .where(eq(rosterEntries.id, entryId))
      .limit(1);

    const result = await db
      .update(rosterEntries)
      .set({ 
        playerId,
        playerName,
        gameId: gameId ?? null,
        pickedTeam: pickedTeam ?? null,
        pickedSpread: pickedSpread ?? null,
        updatedAt: new Date()
      })
      .where(eq(rosterEntries.id, entryId))
      .returning();

    console.log('Database update result:', result);

    // If the week is locked (games started), recalculate fantasy points
    if (existingEntry[0]) {
      const weekLocked = await isWeekLocked(existingEntry[0].seasonId, existingEntry[0].week);
      if (weekLocked) {
        console.log('Week is locked, recalculating fantasy points...');
        await recalculateEntryFantasyPoints(entryId);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update roster entry:', error);
    return { success: false, error: 'Failed to update roster entry' };
  }
}

export async function initializeRosterEntries(participantId: number, seasonId?: number) {
  try {
    // Get or create active season if no seasonId provided
    const season = seasonId 
      ? { id: seasonId }
      : await getOrCreateActiveSeason();
    
    const positions = ['QB', 'RB', 'WR', 'FLEX', 'TEAM'];
    const weeks = [1, 2, 3, 4];

    for (const position of positions) {
      for (const week of weeks) {
        await db.insert(rosterEntries).values({
          participantId,
          seasonId: season.id,
          position,
          week,
          playerName: '',
          playerId: null,
          team: null,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to initialize roster entries:', error);
    return { success: false, error: 'Failed to initialize roster entries' };
  }
}

export async function getWeekLockTimes(seasonId: number) {
  try {
    const { games } = await import('@/app/lib/db/schema');
    const { min } = await import('drizzle-orm');
    
    // Get the earliest game time for each week
    const lockTimes = await db
      .select({
        week: games.week,
        lockTime: min(games.gameTime),
      })
      .from(games)
      .where(eq(games.seasonId, seasonId))
      .groupBy(games.week);
    
    return lockTimes;
  } catch (error) {
    console.error('Failed to fetch week lock times:', error);
    return [];
  }
}

export async function isWeekLocked(seasonId: number, week: number): Promise<boolean> {
  try {
    const lockTimes = await getWeekLockTimes(seasonId);
    const weekLockTime = lockTimes.find(lt => lt.week === week)?.lockTime;
    
    if (!weekLockTime) {
      return false; // No games for this week yet, not locked
    }
    
    return new Date() >= new Date(weekLockTime);
  } catch (error) {
    console.error('Failed to check week lock status:', error);
    return false;
  }
}

export async function getParticipantWeeklyScores(participantId: number, seasonId: number) {
  try {
    const { sql, and } = await import('drizzle-orm');
    
    const weeklyTotals = await db
      .select({
        week: rosterEntries.week,
        totalPoints: sql<number>`COALESCE(SUM(${rosterEntries.fantasyPoints}), 0)`,
      })
      .from(rosterEntries)
      .where(and(
        eq(rosterEntries.participantId, participantId),
        eq(rosterEntries.seasonId, seasonId)
      ))
      .groupBy(rosterEntries.week);
    
    return weeklyTotals;
  } catch (error) {
    console.error('Failed to fetch weekly scores:', error);
    return [];
  }
}

export async function getAllParticipantsScores(seasonId: number) {
  try {
    const { sql } = await import('drizzle-orm');
    
    const scores = await db
      .select({
        participantId: rosterEntries.participantId,
        week: rosterEntries.week,
        totalPoints: sql<number>`COALESCE(SUM(${rosterEntries.fantasyPoints}), 0)`,
      })
      .from(rosterEntries)
      .where(eq(rosterEntries.seasonId, seasonId))
      .groupBy(rosterEntries.participantId, rosterEntries.week);
    
    return scores;
  } catch (error) {
    console.error('Failed to fetch all participant scores:', error);
    return [];
  }
}

export async function getPlayerStatsForWeek(seasonId: number, week: number) {
  try {
    const { sql } = await import('drizzle-orm');
    
    // Get all unique players who were rostered for this week
    const rosteredPlayers = await db
      .select({
        playerId: rosterEntries.playerId,
        playerName: players.name,
        position: players.position,
        team: players.team,
        rosterCount: sql<number>`COUNT(DISTINCT ${rosterEntries.participantId})`,
      })
      .from(rosterEntries)
      .leftJoin(players, eq(rosterEntries.playerId, players.id))
      .where(
        and(
          eq(rosterEntries.seasonId, seasonId),
          eq(rosterEntries.week, week)
        )
      )
      .groupBy(
        rosterEntries.playerId,
        players.name,
        players.position,
        players.team
      );

    // Filter out NULL player IDs and get stats for valid players
    const playerIds = rosteredPlayers
      .map(p => p.playerId)
      .filter((id): id is number => id !== null);
    
    if (playerIds.length === 0) {
      return [];
    }

    const { inArray } = await import('drizzle-orm');
    
    const stats = await db
      .select()
      .from(playerGameStats)
      .where(
        and(
          eq(playerGameStats.seasonId, seasonId),
          eq(playerGameStats.week, week),
          inArray(playerGameStats.playerId, playerIds)
        )
      );

    // Combine roster info with stats (filter out NULL player IDs)
    const result = rosteredPlayers
      .filter(player => player.playerId !== null)
      .map(player => {
        const playerStats = stats.find(s => s.playerId === player.playerId);
        
        return {
          playerId: player.playerId!,
          playerName: player.playerName || 'Unknown',
          position: player.position || 'N/A',
          team: player.team || 'N/A',
          rosterCount: player.rosterCount,
          passingYards: playerStats?.passingYards || null,
          passingTDs: playerStats?.passingTDs || null,
          passing2PtConversions: playerStats?.passing2PtConversions || null,
          rushingYards: playerStats?.rushingYards || null,
          rushingTDs: playerStats?.rushingTDs || null,
          rushing2PtConversions: playerStats?.rushing2PtConversions || null,
          receivingYards: playerStats?.receivingYards || null,
          receivingTDs: playerStats?.receivingTDs || null,
          receiving2PtConversions: playerStats?.receiving2PtConversions || null,
          fantasyPoints: playerStats?.fantasyPoints || null,
        };
      });

    return result;
  } catch (error) {
    console.error('Failed to fetch player stats for week:', error);
    return [];
  }
}
