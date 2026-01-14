'use server';

import { db } from '@/app/lib/db';
import { participants, rosterEntries, seasons } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

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

export async function getRosterEntries(participantId: number) {
  try {
    const { players } = await import('@/app/lib/db/schema');
    
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
        createdAt: rosterEntries.createdAt,
        updatedAt: rosterEntries.updatedAt,
        player: players,
      })
      .from(rosterEntries)
      .leftJoin(players, eq(rosterEntries.playerId, players.id))
      .where(eq(rosterEntries.participantId, participantId));
    
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
