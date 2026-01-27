import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { games, rosterEntries } from '@/app/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// One-time fix to reset team fantasy points for non-final games
export async function POST(request: NextRequest) {
  try {
    const { seasonId, week } = await request.json();
    
    if (!seasonId || !week) {
      return NextResponse.json({ error: 'Missing seasonId or week' }, { status: 400 });
    }

    console.log(`[Fix Team Points] Resetting team points for non-final games in Season ${seasonId}, Week ${week}`);

    // Get all games for this week that are NOT final
    const weekGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.seasonId, seasonId),
        eq(games.week, week)
      ));

    const nonFinalGameIds = weekGames
      .filter(g => {
        // Check for various final status formats
        const isFinal = g.status === 'STATUS_FINAL' || 
                        g.status === 'Final' || 
                        g.status === 'final' ||
                        (g.status && g.status.includes('FINAL'));
        return !isFinal;
      })
      .map(g => g.id);

    if (nonFinalGameIds.length === 0) {
      return NextResponse.json({ 
        message: 'No non-final games found',
        gamesChecked: weekGames.length 
      });
    }

    console.log(`[Fix Team Points] Found ${nonFinalGameIds.length} non-final games`);

    // Reset fantasy points for team picks in non-final games
    const result = await db
      .update(rosterEntries)
      .set({
        fantasyPoints: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(rosterEntries.seasonId, seasonId),
        eq(rosterEntries.week, week),
        eq(rosterEntries.position, 'TEAM'),
        inArray(rosterEntries.gameId, nonFinalGameIds)
      ))
      .returning();

    console.log(`[Fix Team Points] Reset ${result.length} team roster entries`);

    return NextResponse.json({
      success: true,
      resetCount: result.length,
      nonFinalGames: nonFinalGameIds.length,
      totalGames: weekGames.length,
    });
  } catch (error) {
    console.error('Error fixing team points:', error);
    return NextResponse.json(
      { error: 'Failed to fix team points' },
      { status: 500 }
    );
  }
}
