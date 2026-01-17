import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { games, seasons } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for execution

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting scheduled stats update...');

    // Get active season
    const activeSeason = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    if (!activeSeason[0]) {
      return NextResponse.json({ error: 'No active season found' }, { status: 404 });
    }

    const seasonId = activeSeason[0].id;

    // Get all weeks with games
    const allGames = await db
      .select({ week: games.week })
      .from(games)
      .where(eq(games.seasonId, seasonId))
      .groupBy(games.week);

    const weeks = allGames.map(g => g.week);
    console.log(`[Cron] Found ${weeks.length} weeks to update`);

    // Update stats for each week
    const results = [];
    for (const week of weeks) {
      console.log(`[Cron] Updating week ${week}...`);
      
      const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/stats/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seasonId, week }),
      });

      const result = await response.json();
      results.push({ week, ...result });
      console.log(`[Cron] Week ${week} complete:`, result);
    }

    console.log('[Cron] Scheduled stats update complete');

    return NextResponse.json({
      success: true,
      seasonId,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error in scheduled stats update:', error);
    return NextResponse.json(
      { error: 'Failed to update stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
