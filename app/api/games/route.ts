import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { games } from '@/app/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get('seasonId');
  const week = searchParams.get('week');

  if (!seasonId || !week) {
    return NextResponse.json({ error: 'Missing seasonId or week' }, { status: 400 });
  }

  try {
    const weekGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.seasonId, parseInt(seasonId)),
        eq(games.week, parseInt(week))
      ))
      .orderBy(games.gameTime);

    return NextResponse.json({ games: weekGames });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
