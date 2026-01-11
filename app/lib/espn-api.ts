// ESPN API integration for NFL player data

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

// 2025 NFL Playoff Teams
const PLAYOFF_TEAMS_2025 = [
  'BUF', 'BAL', 'KC', 'HOU', 'LAC', 'PIT', 'DEN',  // AFC
  'PHI', 'DET', 'TB', 'LAR', 'MIN', 'GB', 'WSH'   // NFC
];

export interface ESPNPlayer {
  id: string;
  displayName: string;
  position: {
    abbreviation: string;
  };
  team: {
    abbreviation: string;
  };
  jersey?: string;
  status?: {
    type: string;
  };
  headshot?: {
    href: string;
  };
}

export async function fetchNFLPlayoffPlayers(): Promise<ESPNPlayer[]> {
  try {
    console.log('[ESPN API] Fetching NFL teams...');
    const teamsResponse = await fetch(`${ESPN_API_BASE}/teams?limit=32`);
    if (!teamsResponse.ok) {
      console.error(`[ESPN API] Teams API returned ${teamsResponse.status}`);
      throw new Error(`ESPN API returned ${teamsResponse.status}`);
    }
    const teamsData = await teamsResponse.json();
    console.log(`[ESPN API] Found ${teamsData.sports[0].leagues[0].teams.length} teams`);
    
    const allPlayers: ESPNPlayer[] = [];
    const allowedPositions = ['QB', 'WR', 'RB', 'TE'];
    
    // For each playoff team, fetch roster
    for (const team of teamsData.sports[0].leagues[0].teams) {
      const teamAbbreviation = team.team.abbreviation;
      
      // Skip non-playoff teams
      if (!PLAYOFF_TEAMS_2025.includes(teamAbbreviation)) {
        continue;
      }
      
      try {
        const teamId = team.team.id;
        console.log(`[ESPN API] Fetching roster for ${teamAbbreviation} (${teamId})...`);
        const rosterResponse = await fetch(
          `${ESPN_API_BASE}/teams/${teamId}/roster`
        );
        if (!rosterResponse.ok) {
          console.warn(`[ESPN API] Roster API returned ${rosterResponse.status} for team ${teamAbbreviation}`);
          continue;
        }
        const rosterData = await rosterResponse.json();
        
        if (rosterData.athletes) {
          // Only process offense group
          const offenseGroup = rosterData.athletes.find((group: any) => group.position === 'offense');
          
          if (offenseGroup && offenseGroup.items) {
            // Filter for fantasy-relevant positions
            const playersWithTeam = offenseGroup.items
              .filter((player: ESPNPlayer) => 
                allowedPositions.includes(player.position?.abbreviation)
              )
              .map((player: ESPNPlayer) => ({
                ...player,
                team: {
                  abbreviation: teamAbbreviation
                }
              }));
            console.log(`[ESPN API] ${teamAbbreviation}: ${playersWithTeam.length} playoff players`);
            allPlayers.push(...playersWithTeam);
          } else {
            console.warn(`[ESPN API] ${teamAbbreviation}: No offense group found`);
          }
        } else {
          console.warn(`[ESPN API] ${teamAbbreviation}: No athletes data`);
        }
      } catch (error) {
        console.error(`[ESPN API] Error fetching roster for team ${team.team.id}:`, error);
      }
    }
    
    console.log(`[ESPN API] Total playoff players fetched: ${allPlayers.length}`);
    return allPlayers;
  } catch (error) {
    console.error('Error fetching NFL playoff players:', error);
    throw error;
  }
}

export async function searchNFLPlayers(query: string): Promise<ESPNPlayer[]> {
  try {
    const allPlayers = await fetchNFLPlayoffPlayers();
    const lowerQuery = query.toLowerCase();
    
    return allPlayers.filter(player => 
      player.displayName.toLowerCase().includes(lowerQuery) ||
      player.team?.abbreviation?.toLowerCase().includes(lowerQuery) ||
      player.position?.abbreviation?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching NFL players:', error);
    throw error;
  }
}
