import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file BEFORE importing anything else
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../app/lib/db';
import { participants, players, rosterEntries, seasons, games } from '../app/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Player name mappings to resolve ambiguous matches
// General fallback mappings (used if position-specific mapping not found)
const PLAYER_MAP: Record<string, string> = {
  'Allen': 'Josh Allen',
  'Cook': 'James Cook III',
  'Collins': 'Nico Collins',
  'Etienne': 'Travis Etienne Jr.',
  'Love': 'Jordan Love',
  'Watson': 'Christian Watson',
  'Hampton': 'Omarion Hampton',
  'Thomas': 'Brian Thomas Jr.',
  'Diggs': 'Stefon Diggs',
  'AJ Brown': 'A.J. Brown',
};

// Position-specific mappings to disambiguate picks like "Williams"
const PLAYER_MAP_BY_POSITION: Record<string, Record<string, string>> = {
  QB: {
    'Allen': 'Josh Allen',
    'Love': 'Jordan Love',
    'Maye': 'Drake Maye',
    'Lawrence': 'Trevor Lawrence',
    'Hurts': 'Jalen Hurts',
    'Purdy': 'Brock Purdy',
    'Stroud': 'C.J. Stroud',
    'Williams': 'Caleb Williams',
  },
  RB: {
    'Barkley': 'Saquon Barkley',
    'McCaffrey': 'Christian McCaffrey',
    'Jacobs': 'Josh Jacobs',
    'Swift': "D'Andre Swift",
    'Etienne': 'Travis Etienne Jr.',
    'Cook': 'James Cook III',
    'Williams': 'Kyren Williams',
    'Hampton': 'Omarion Hampton',
  },
  WR: {
    'Nacua': 'Puka Nacua',
    'Collins': 'Nico Collins',
    'Watson': 'Christian Watson',
    'Adams': 'Davante Adams',
    'Thomas': 'Brian Thomas Jr.',
    'McMillan': 'Tetairoa McMillan',
    'McConkey': 'Ladd McConkey',
    'AJ Brown': 'A.J. Brown',
    'Myers': 'Jakobi Meyers',
    'Henry': 'Hunter Henry',
  },
  FLEX: {
    // FLEX can be RB/WR/TE; prefer star players by context
    'McCaffrey': 'Christian McCaffrey',
    'Barkley': 'Saquon Barkley',
    'Jacobs': 'Josh Jacobs',
    'Etienne': 'Travis Etienne Jr.',
    'Cook': 'James Cook III',
    'Williams': 'Kyren Williams',
    'Kittle': 'George Kittle',
    'Diggs': 'Stefon Diggs',
    'Marks': 'Woody Marks',
    'McConkey': 'Ladd McConkey',
    'Nacua': 'Puka Nacua',
    'Adams': 'Davante Adams',
    'AJ Brown': 'A.J. Brown',
    'Myers': 'Jakobi Meyers',
    'Navis': 'Gabe Davis',
  },
};

// Team name variations to match with game data (games use abbreviations)
const TEAM_MAP: Record<string, string[]> = {
  'Green Bay': ['GB'],
  'San Francisco': ['SF'],
  'Buffalo': ['BUF'],
  'Houston': ['HOU'],
  'New England': ['NE'],
  'Philadelphia': ['PHI'],
  'Jacksonville': ['JAX'],
  'Carolina': ['CAR'],
  'Chicago': ['CHI'],
  'LA Rams': ['LAR'],
  'Pittsburgh': ['PIT'],
  'Los Angeles': ['LAC'],  // Chargers
};

// Week 1 picks data
const picksData = [
  { name: 'John B', qb: 'Hurts', rb: 'Barkley', wr: 'AJ Brown', flex: 'Jacobs', team: 'Green Bay' },
  { name: 'Monica B', qb: 'Hurts', rb: 'McCaffrey', wr: 'Nacua', flex: 'Etienne', team: 'San Francisco' },
  { name: 'Ainsley B', qb: 'Allen', rb: 'McCaffrey', wr: 'AJ Brown', flex: 'McConkey', team: 'Buffalo' },
  { name: 'Will B', qb: 'Lawrence', rb: 'Cook', wr: 'McConkey', flex: 'Etienne', team: 'Buffalo' },
  { name: 'Shoup', qb: 'Lawrence', rb: 'McCaffrey', wr: 'Collins', flex: 'Jacobs', team: 'Houston' },
  { name: 'Tim F', qb: 'Williams', rb: 'McCaffrey', wr: 'AJ Brown', flex: 'Kittle', team: 'Buffalo' },
  { name: 'Jason G', qb: 'Lawrence', rb: 'McCaffrey', wr: 'Henry', flex: 'Hampton', team: 'Houston' },
  { name: 'Drew G', qb: 'Allen', rb: 'Barkley', wr: 'McConkey', flex: 'Kittle', team: 'Houston' },
  { name: 'Alex F1', qb: 'Maye', rb: 'Cook', wr: 'Nacua', flex: 'Barkley', team: 'New England' },
  { name: 'Alex F2', qb: 'Allen', rb: 'Cook', wr: 'Collins', flex: 'Etienne', team: 'Buffalo' },
  { name: 'Alex F3', qb: 'Hurts', rb: 'Barkley', wr: 'AJ Brown', flex: 'McCaffrey', team: 'Philadelphia' },
  { name: 'Erin S', qb: 'Love', rb: 'Barkley', wr: 'Watson', flex: 'Collins', team: 'Jacksonville' },
  { name: 'Bea N', qb: 'Hurts', rb: 'McCaffrey', wr: 'Collins', flex: 'Williams', team: 'Carolina' },
  { name: 'Erin N', qb: 'Allen', rb: 'McCaffrey', wr: 'McMillan', flex: 'Etienne', team: 'Carolina' },
  { name: 'Nick H', qb: 'Allen', rb: 'Etienne', wr: 'McMillan', flex: 'Adams', team: 'New England' },
  { name: 'Mike M1', qb: 'Allen', rb: 'McCaffrey', wr: 'Collins', flex: 'Barkley', team: 'Jacksonville' },
  { name: 'Mike M2', qb: 'Hurts', rb: 'Cook', wr: 'Nacua', flex: 'Hampton', team: 'Carolina' },
  { name: 'Luke D', qb: 'Lawrence', rb: 'Hampton', wr: 'Kittle', flex: 'Barkley', team: 'Houston' },
  { name: 'Peter K', qb: 'Allen', rb: 'Williams', wr: 'Thomas', flex: 'McCaffrey', team: 'Houston' },
  { name: 'Jon H', qb: 'Lawrence', rb: 'Barkley', wr: 'Collins', flex: 'McCaffrey', team: 'Chicago' },
  { name: 'Tim A', qb: 'Allen', rb: 'Jacobs', wr: 'AJ Brown', flex: 'Diggs', team: 'Houston' },
  { name: 'Jeff E', qb: 'Williams', rb: 'Swift', wr: 'Collins', flex: 'Marks', team: 'New England' },
  { name: 'Mitch S', qb: 'Allen', rb: 'Barkley', wr: 'Nacua', flex: 'McCaffrey', team: 'Green Bay' },
  { name: 'Jenna S', qb: 'Stafford', rb: 'McCaffrey', wr: 'Nacua', flex: 'Barkley', team: 'Buffalo' },
  { name: 'Anne H1', qb: 'Allen', rb: 'McCaffrey', wr: 'Watson', flex: 'Navis', team: 'Buffalo' },
  { name: 'Anne H2', qb: 'Lawrence', rb: 'Cook', wr: 'Collins', flex: 'Kittle', team: 'Philadelphia' },
  { name: 'Robert S', qb: 'Stafford', rb: 'McCaffrey', wr: 'Nacua', flex: 'Swift', team: 'Pittsburgh' },
  { name: 'Tony M', qb: 'Stafford', rb: 'Barkley', wr: 'Nacua', flex: 'McCaffrey', team: 'Houston' },
  { name: 'Sean O', qb: 'Love', rb: 'Etienne', wr: 'Adams', flex: 'Cook', team: 'Green Bay' },
  { name: 'Lewis O', qb: 'Lawrence', rb: 'Jacobs', wr: 'Nacua', flex: 'McCaffrey', team: 'LA Rams' },
  { name: 'Anju G', qb: 'Love', rb: 'McCaffrey', wr: 'AJ Brown', flex: 'Kittle', team: 'Houston' },
  { name: 'JHanson1', qb: 'Hurts', rb: 'McCaffrey', wr: 'McMillan', flex: 'McConkey', team: 'San Francisco' },
  { name: 'JHanson2', qb: 'Maye', rb: 'Jacobs', wr: 'Collins', flex: 'Barkley', team: 'Houston' },
  { name: 'Ryan H', qb: 'Allen', rb: 'McCaffrey', wr: 'AJ Brown', flex: 'Jacobs', team: 'New England' },
  { name: 'Mike P', qb: 'Lawrence', rb: 'McCaffrey', wr: 'AJ Brown', flex: 'Williams', team: 'Philadelphia' },
  { name: 'Sarah P', qb: 'Allen', rb: 'McCaffrey', wr: 'Collins', flex: 'Myers', team: 'Green Bay' },
  { name: 'Greeno', qb: 'Allen', rb: 'McCaffrey', wr: 'AJ Brown', flex: 'Etienne', team: 'Houston' },
  { name: 'Karli S', qb: 'Lawrence', rb: 'McCaffrey', wr: 'Collins', flex: 'Cook', team: 'Chicago' },
  { name: 'Alex T', qb: 'Lawrence', rb: 'McCaffrey', wr: 'Collins', flex: 'Barkley', team: 'Buffalo' },
  { name: 'Joyce T', qb: 'Lawrence', rb: 'McCaffrey', wr: 'AJ Brown', flex: 'Cook', team: 'Philadelphia' },
  { name: 'Jeff H1', qb: 'Purdy', rb: 'Cook', wr: 'McMillan', flex: 'Jacobs', team: 'Houston' },
  { name: 'Jeff H2', qb: 'Allen', rb: 'McCaffrey', wr: 'Nacua', flex: 'AJ Brown', team: 'Houston' },
  { name: 'Matthew S', qb: 'Allen', rb: 'Jacobs', wr: 'McMillan', flex: 'McCaffrey', team: 'Houston' },
  { name: 'Reid S', qb: 'Lawrence', rb: 'McCaffrey', wr: 'Collins', flex: 'Barkley', team: 'Houston' },
  { name: 'Andy F', qb: 'Allen', rb: 'Barkley', wr: 'McMillan', flex: 'McCaffrey', team: 'Chicago' },
  { name: 'Matt G', qb: 'Allen', rb: 'McCaffrey', wr: 'Nacua', flex: 'AJ Brown', team: 'Houston' },
  { name: 'Adam M', qb: 'Stroud', rb: 'Williams', wr: 'Watson', flex: 'Collins', team: 'Houston' },
  { name: 'John M', qb: 'Maye', rb: 'McCaffrey', wr: 'Nacua', flex: 'Cook', team: 'New England' },
];

interface MatchResult {
  success: boolean;
  participantId?: number;
  entries?: any[];
  errors?: string[];
}

async function loadWeek1Picks() {
  console.log('Starting Week 1 picks load...\n');

  // Get active season
  const [activeSeason] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);

  if (!activeSeason) {
    console.error('No active season found!');
    return;
  }

  console.log(`Active season: ${activeSeason.year} (ID: ${activeSeason.id})\n`);

  // Get all participants
  const allParticipants = await db.select().from(participants);
  console.log(`Found ${allParticipants.length} participants in database\n`);

  // Get all players
  const allPlayers = await db.select().from(players);
  console.log(`Found ${allPlayers.length} players in database\n`);

  // Get week 1 games for team picks
  const week1Games = await db
    .select()
    .from(games)
    .where(and(
      eq(games.seasonId, activeSeason.id),
      eq(games.week, 1)
    ));

  console.log(`Found ${week1Games.length} games for Week 1\n`);

  const results: MatchResult[] = [];
  const unmatched: string[] = [];

  for (const pick of picksData) {
    console.log(`\nProcessing: ${pick.name}`);
    const errors: string[] = [];

    // Match participant
    const participant = allParticipants.find(p => p.name === pick.name);
    if (!participant) {
      errors.push(`❌ Participant not found: ${pick.name}`);
      unmatched.push(`Participant: ${pick.name}`);
      results.push({ success: false, errors });
      continue;
    }

    console.log(`  ✓ Found participant: ${participant.name} (ID: ${participant.id})`);

    // Match players
    const positions = [
      { position: 'QB', lastName: pick.qb },
      { position: 'RB', lastName: pick.rb },
      { position: 'WR', lastName: pick.wr },
      { position: 'FLEX', lastName: pick.flex },
    ];

    const entries = [];

    for (const pos of positions) {
      // Use position-specific mapping first, then general mapping, then raw last name
      const byPos = PLAYER_MAP_BY_POSITION[pos.position]?.[pos.lastName];
      const targetName = byPos || PLAYER_MAP[pos.lastName] || pos.lastName;

      let matchedPlayers = allPlayers.filter(p =>
        p.name.toLowerCase().includes(targetName.toLowerCase())
      );

      // If still multiple matches with mapped name, try exact match
      if (matchedPlayers.length > 1) {
        const exactMatch = allPlayers.find(p => 
          p.name.toLowerCase() === targetName.toLowerCase()
        );
        if (exactMatch) {
          matchedPlayers = [exactMatch];
        }
      }

      if (matchedPlayers.length === 0) {
        console.log(`  ❌ ${pos.position}: No match for "${pos.lastName}"`);
        errors.push(`❌ No player found for ${pos.position}: ${pos.lastName}`);
        unmatched.push(`${pick.name} - ${pos.position}: ${pos.lastName}`);
        // Still create entry with just the name
        entries.push({
          participantId: participant.id,
          seasonId: activeSeason.id,
          position: pos.position,
          week: 1,
          playerId: null,
          playerName: pos.lastName,
        });
      } else if (matchedPlayers.length === 1) {
        console.log(`  ✓ ${pos.position}: ${matchedPlayers[0].name}`);
        entries.push({
          participantId: participant.id,
          seasonId: activeSeason.id,
          position: pos.position,
          week: 1,
          playerId: matchedPlayers[0].id,
          playerName: matchedPlayers[0].name,
        });
      } else {
        // Multiple matches - use first match
        console.log(`  ⚠️  ${pos.position}: Multiple matches for "${pos.lastName}", using ${matchedPlayers[0].name}`);
        matchedPlayers.slice(0, 3).forEach(p => console.log(`      - ${p.name} (${p.team}, ${p.position})`));
        errors.push(`⚠️  Multiple matches for ${pos.position}: ${pos.lastName}`);
        unmatched.push(`${pick.name} - ${pos.position}: ${pos.lastName} (using: ${matchedPlayers[0].name})`);
        entries.push({
          participantId: participant.id,
          seasonId: activeSeason.id,
          position: pos.position,
          week: 1,
          playerId: matchedPlayers[0].id,
          playerName: matchedPlayers[0].name,
        });
      }
    }

    // Handle TEAM pick
    const teamAbbrev = pick.team;
    const teamVariations = TEAM_MAP[teamAbbrev] || [teamAbbrev];
    
    const game = week1Games.find(g => {
      const homeTeamLower = g.homeTeam.toLowerCase();
      const awayTeamLower = g.awayTeam.toLowerCase();
      return teamVariations.some(variation => 
        homeTeamLower.includes(variation.toLowerCase()) || 
        awayTeamLower.includes(variation.toLowerCase())
      );
    });

    if (!game) {
      console.log(`  ❌ TEAM: No game found for "${teamAbbrev}"`);
      errors.push(`❌ No game found for team: ${teamAbbrev}`);
      unmatched.push(`${pick.name} - TEAM: ${teamAbbrev}`);
      entries.push({
        participantId: participant.id,
        seasonId: activeSeason.id,
        position: 'TEAM',
        week: 1,
        playerId: null,
        playerName: teamAbbrev,
        gameId: null,
        pickedTeam: null,
        pickedSpread: null,
      });
    } else {
      const homeTeamLower = game.homeTeam.toLowerCase();
      const isHome = teamVariations.some(variation => 
        homeTeamLower.includes(variation.toLowerCase())
      );
      const pickedTeam = isHome ? game.homeTeam : game.awayTeam;
      const pickedSpread = game.spread ? (isHome ? game.spread : -game.spread) : null;
      console.log(`  ✓ TEAM: ${pickedTeam} (spread: ${pickedSpread})`);
      entries.push({
        participantId: participant.id,
        seasonId: activeSeason.id,
        position: 'TEAM',
        week: 1,
        playerId: null,
        playerName: pickedTeam,
        gameId: game.id,
        pickedTeam: pickedTeam,
        pickedSpread: pickedSpread,
      });
    }

    results.push({
      success: errors.length === 0,
      participantId: participant.id,
      entries,
      errors: errors.length > 0 ? errors : undefined,
    });

    // Insert entries into database
    for (const entry of entries) {
      // Check if entry already exists
      const existing = await db
        .select()
        .from(rosterEntries)
        .where(and(
          eq(rosterEntries.participantId, entry.participantId),
          eq(rosterEntries.seasonId, entry.seasonId),
          eq(rosterEntries.position, entry.position),
          eq(rosterEntries.week, entry.week)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing entry
        await db
          .update(rosterEntries)
          .set({
            playerId: entry.playerId,
            playerName: entry.playerName,
            gameId: entry.gameId || null,
            pickedTeam: entry.pickedTeam || null,
            pickedSpread: entry.pickedSpread || null,
            updatedAt: new Date(),
          })
          .where(eq(rosterEntries.id, existing[0].id));
      } else {
        // Insert new entry
        await db.insert(rosterEntries).values(entry);
      }
    }
  }

  console.log('\n\n=== SUMMARY ===');
  console.log(`Total participants processed: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`With warnings: ${results.filter(r => !r.success).length}`);

  if (unmatched.length > 0) {
    console.log('\n=== UNMATCHED ITEMS ===');
    unmatched.forEach(item => console.log(item));
  }

  console.log('\n✓ Week 1 picks loaded!');
}

loadWeek1Picks().catch(console.error);
