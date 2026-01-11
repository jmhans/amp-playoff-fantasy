'use server';

import { db } from '@/app/lib/db';
import { players } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchNFLPlayoffPlayers, type ESPNPlayer } from '@/app/lib/espn-api';
import { revalidatePath } from 'next/cache';

export async function syncPlayersFromESPN() {
  try {
    console.log('[Player Sync] Starting ESPN player sync (playoff teams only)...');
    const espnPlayers = await fetchNFLPlayoffPlayers();
    console.log(`[Player Sync] Fetched ${espnPlayers.length} playoff players from ESPN API`);
    let syncedCount = 0;
    
    for (const espnPlayer of espnPlayers) {
      try {
        // Check if player already exists
        const existing = await db
          .select()
          .from(players)
          .where(eq(players.espnId, espnPlayer.id))
          .limit(1);
        
        const playerData = {
          espnId: espnPlayer.id,
          name: espnPlayer.displayName,
          position: espnPlayer.position?.abbreviation || 'UNK',
          team: espnPlayer.team?.abbreviation || 'FA',
          updatedAt: new Date(),
        };
        
        if (existing.length > 0) {
          // Update existing player
          await db
            .update(players)
            .set(playerData)
            .where(eq(players.id, existing[0].id));
        } else {
          // Insert new player
          await db.insert(players).values(playerData);
        }
        
        syncedCount++;
        if (syncedCount % 50 === 0) {
          console.log(`[Player Sync] Progress: ${syncedCount} players synced...`);
        }
      } catch (error) {
        console.error(`Error syncing player ${espnPlayer.displayName}:`, error);
      }
    }
    
    console.log(`[Player Sync] Complete: ${syncedCount} players synced successfully`);
    revalidatePath('/admin');
    return { success: true, count: syncedCount };
  } catch (error) {
    console.error('Error syncing players:', error);
    return { error: 'Failed to sync players from ESPN' };
  }
}

export async function searchPlayers(query: string) {
  try {
    if (!query || query.trim() === '') {
      // Return first 100 players ordered by name
      return await db.select().from(players).limit(100);
    }
    
    const searchTerm = `%${query.toLowerCase()}%`;
    const { sql: rawSql } = await import('drizzle-orm');
    
    const result = await db
      .select()
      .from(players)
      .where(
        rawSql`(LOWER(${players.name}) LIKE ${searchTerm} 
          OR LOWER(${players.team}) LIKE ${searchTerm}
          OR LOWER(${players.position}) LIKE ${searchTerm})`
      )
      .limit(100);
    
    return result;
  } catch (error) {
    console.error('Error searching players:', error);
    throw new Error('Failed to search players');
  }
}

export async function getAllPlayers() {
  try {
    return await db.select().from(players).orderBy(players.name).limit(500);
  } catch (error) {
    console.error('Error fetching players:', error);
    throw new Error('Failed to fetch players');
  }
}

/**
 * Import players from specific NFL teams and positions
 */
export async function importPlayersFromTeams(teams: string[], positions: string[]) {
  const logs: string[] = [];
  
  try {
    logs.push(`Starting import for teams: ${teams.join(', ')}`);
    logs.push(`Positions: ${positions.join(', ')}`);
    
    const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
    let importedCount = 0;
    let teamsProcessed = 0;
    
    // Fetch teams data to get team IDs
    logs.push('Fetching teams from ESPN...');
    const teamsResponse = await fetch(`${ESPN_API_BASE}/teams?limit=32`);
    if (!teamsResponse.ok) {
      throw new Error(`ESPN API returned ${teamsResponse.status}`);
    }
    const teamsData = await teamsResponse.json();
    
    // Filter for selected teams
    const selectedTeams = teamsData.sports[0].leagues[0].teams.filter((team: any) => 
      teams.includes(team.team.abbreviation)
    );
    
    logs.push(`Found ${selectedTeams.length} matching teams`);
    
    // For each selected team, fetch roster
    for (const teamData of selectedTeams) {
      try {
        const teamId = teamData.team.id;
        const teamAbbreviation = teamData.team.abbreviation;
        
        logs.push(`\nFetching roster for ${teamAbbreviation}...`);
        
        const rosterResponse = await fetch(
          `${ESPN_API_BASE}/teams/${teamId}/roster`
        );
        
        if (!rosterResponse.ok) {
          logs.push(`⚠️ Roster API returned ${rosterResponse.status} for ${teamAbbreviation}`);
          continue;
        }
        
        const rosterData = await rosterResponse.json();
        
        if (!rosterData.athletes) {
          logs.push(`⚠️ ${teamAbbreviation}: No athletes data found`);
          continue;
        }
        
        // Only process offense group
        const offenseGroup = rosterData.athletes.find((group: any) => group.position === 'offense');
        
        if (!offenseGroup) {
          logs.push(`⚠️ ${teamAbbreviation}: No offense group found`);
          continue;
        }
        
        // Filter for selected positions
        const playersToImport = offenseGroup.items.filter((player: any) =>
          positions.includes(player.position?.abbreviation)
        );
        
        logs.push(`${teamAbbreviation}: Found ${playersToImport.length} players for selected positions`);
        
        // Import each player
        for (const espnPlayer of playersToImport) {
          try {
            const existing = await db
              .select()
              .from(players)
              .where(eq(players.espnId, espnPlayer.id))
              .limit(1);
            
            const playerData = {
              espnId: espnPlayer.id,
              name: espnPlayer.displayName,
              position: espnPlayer.position?.abbreviation || 'UNK',
              team: teamAbbreviation,
              updatedAt: new Date(),
            };
            
            if (existing.length > 0) {
              await db
                .update(players)
                .set(playerData)
                .where(eq(players.id, existing[0].id));
            } else {
              await db.insert(players).values(playerData);
            }
            
            importedCount++;
          } catch (error) {
            logs.push(`❌ Error importing ${espnPlayer.displayName}: ${error}`);
          }
        }
        
        teamsProcessed++;
      } catch (error) {
        logs.push(`❌ Error processing team ${teamData.team.abbreviation}: ${error}`);
      }
    }
    
    logs.push(`\n✅ Import complete: ${importedCount} players from ${teamsProcessed} teams`);
    
    return {
      success: true,
      count: importedCount,
      teamsProcessed,
      logs: logs.join('\n')
    };
  } catch (error) {
    console.error('Error importing players:', error);
    return {
      error: `Failed to import players: ${error instanceof Error ? error.message : 'Unknown error'}`,
      logs: logs.join('\n')
    };
  }
}
