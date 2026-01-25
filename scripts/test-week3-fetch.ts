#!/usr/bin/env node

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../app/lib/db';
import { games, seasons } from '../app/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testWeek3Fetch() {
  try {
    console.log('=== Testing Week 3 Games Fetch ===\n');
    
    // Get active season
    const [activeSeason] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);
    
    if (!activeSeason) {
      console.log('❌ No active season found');
      return;
    }
    
    console.log(`✅ Active season: ${activeSeason.name} (${activeSeason.year})`);
    
    // Try to fetch week 3 games from ESPN
    const weekNum = 3;
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${activeSeason.year}&seasontype=3&week=${weekNum}`;
    
    console.log(`\n🌐 Fetching from ESPN: ${espnUrl}`);
    
    const response = await fetch(espnUrl);
    const data = await response.json();
    
    console.log(`✅ ESPN Response Status: ${response.status}`);
    console.log(`📊 Events found: ${data.events?.length || 0}`);
    
    if (data.events && data.events.length > 0) {
      console.log('\n📋 Games from ESPN:');
      data.events.forEach((event: any, i: number) => {
        const comp = event.competitions[0];
        const home = comp.competitors.find((c: any) => c.homeAway === 'home');
        const away = comp.competitors.find((c: any) => c.homeAway === 'away');
        console.log(`  ${i + 1}. ${away.team.abbreviation} @ ${home.team.abbreviation}`);
        console.log(`     ESPN ID: ${event.id}`);
        console.log(`     Status: ${comp.status?.type?.description}`);
      });
    } else {
      console.log('\n❌ No games found in ESPN response');
      console.log('   This could mean:');
      console.log('   1. Week 3 hasnt started yet');
      console.log('   2. The ESPN API URL is incorrect');
      console.log('   3. The week number is wrong');
    }
    
    // Check what's in the database
    console.log('\n🗄️  Checking database for all weeks...');
    const allGames = await db.select().from(games).where(eq(games.seasonId, activeSeason.id));
    const gamesByWeek: { [key: number]: any[] } = {};
    
    allGames.forEach(g => {
      if (!gamesByWeek[g.week]) {
        gamesByWeek[g.week] = [];
      }
      gamesByWeek[g.week].push(g);
    });
    
    Object.keys(gamesByWeek)
      .map(Number)
      .sort()
      .forEach(week => {
        const count = gamesByWeek[week].length;
        const withEspnId = gamesByWeek[week].filter((g: any) => g.espnGameId).length;
        const status = week === 3 ? (count === 0 ? '❌' : '✅') : count > 0 ? '✅' : '⚠️';
        console.log(`  ${status} Week ${week}: ${count} games (${withEspnId} with ESPN ID)`);
      });
    
    if (!gamesByWeek[3] || gamesByWeek[3].length === 0) {
      console.log('\n⚠️  Week 3 games missing from database!');
      console.log('   Action: Use the Admin > Manage Spreads page to load and save Week 3 games');
    }
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

testWeek3Fetch();
