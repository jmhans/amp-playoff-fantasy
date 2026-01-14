import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/app/lib/auth0';
import { isAdmin } from '@/app/lib/auth-utils';
import { db } from '@/app/lib/db';
import { games, seasons } from '@/app/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth0.getSession();
  
  if (!session?.user || !isAdmin(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return NextResponse.json({ error: 'Week parameter required' }, { status: 400 });
  }

  try {
    // Get active season
    const [activeSeason] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    if (!activeSeason) {
      return NextResponse.json({ error: 'No active season' }, { status: 404 });
    }

    // Fetch games from ESPN (playoff games are in weeks 18+)
    const espnWeek = parseInt(week) + 17; // Convert playoff week to ESPN week
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${activeSeason.year}&seasontype=3&week=${week}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch games from ESPN');
    }

    const data = await response.json();
    const espnGames = data.events || [];

    // Get existing games from database
    const existingGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.seasonId, activeSeason.id),
        eq(games.week, parseInt(week))
      ));

    // Map ESPN games to our format
    const gamesData = espnGames.map((event: any) => {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');
      
      const existingGame = existingGames.find(g => g.espnGameId === event.id);

      return {
        id: existingGame?.id,
        espnGameId: event.id,
        homeTeam: homeTeam.team.abbreviation,
        awayTeam: awayTeam.team.abbreviation,
        gameTime: new Date(event.date),
        spread: existingGame?.spread || null,
      };
    });

    return NextResponse.json({
      games: gamesData,
      seasonId: activeSeason.id,
      week: parseInt(week),
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth0.getSession();
  
  if (!session?.user || !isAdmin(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { seasonId, week, gamesData } = body;

    if (!seasonId || !week || !gamesData) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Upsert games
    for (const gameData of gamesData) {
      const { id, espnGameId, homeTeam, awayTeam, gameTime, spread } = gameData;

      if (id) {
        // Update existing game
        await db
          .update(games)
          .set({
            homeTeam,
            awayTeam,
            gameTime: new Date(gameTime),
            spread: spread ? parseFloat(spread) : null,
            updatedAt: new Date(),
          })
          .where(eq(games.id, id));
      } else {
        // Insert new game
        await db.insert(games).values({
          seasonId,
          week,
          homeTeam,
          awayTeam,
          espnGameId,
          gameTime: new Date(gameTime),
          spread: spread ? parseFloat(spread) : null,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving spreads:', error);
    return NextResponse.json(
      { error: 'Failed to save spreads' },
      { status: 500 }
    );
  }
}
