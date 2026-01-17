import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { players } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Calculate projections based on 2024 regular season stats from ESPN
export async function POST(request: NextRequest) {
  try {
    console.log('[Projections] Starting calculation...');

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    // Get all players or a specific player
    const playerList = playerId
      ? await db.select().from(players).where(eq(players.id, parseInt(playerId)))
      : await db.select().from(players);

    console.log(`[Projections] Processing ${playerList.length} players...`);

    let updated = 0;
    let skipped = 0;

    for (const player of playerList) {
      if (!player.espnId) {
        skipped++;
        continue;
      }

      try {
        // Fetch 2024 regular season stats from ESPN
        const espnUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${player.espnId}/statistics/0`;
        const response = await fetch(espnUrl);

        if (!response.ok) {
          console.log(`[Projections] No data for ${player.name} (${player.espnId})`);
          skipped++;
          continue;
        }

        const data = await response.json();

        // Calculate fantasy points from regular season averages
        // Using standard scoring: 0.04 per pass yd, 4 per pass TD, -2 per INT
        //                        0.1 per rush/rec yd, 6 per rush/rec TD
        const stats = data.splits?.categories?.find((c: any) => c.name === 'general')?.stats || [];
        const getStatValue = (name: string) => {
          const stat = stats.find((s: any) => s.name === name);
          return stat?.value || 0;
        };

        const gamesPlayed = getStatValue('gamesPlayed') || 1; // Avoid division by zero

        // Passing stats
        const passingYards = getStatValue('passingYards');
        const passingTDs = getStatValue('passingTouchdowns');
        const interceptions = getStatValue('interceptions');

        // Rushing stats
        const rushingYards = getStatValue('rushingYards');
        const rushingTDs = getStatValue('rushingTouchdowns');

        // Receiving stats
        const receivingYards = getStatValue('receivingYards');
        const receivingTDs = getStatValue('receivingTouchdowns');
        const receptions = getStatValue('receptions');

        // Calculate total fantasy points for season
        const totalPoints =
          passingYards * 0.04 +
          passingTDs * 4 +
          interceptions * -2 +
          rushingYards * 0.1 +
          rushingTDs * 6 +
          receivingYards * 0.1 +
          receivingTDs * 6 +
          receptions * 0.5; // Half PPR

        // Average per game
        const avgPoints = totalPoints / gamesPlayed;

        // Update player with projected points
        await db
          .update(players)
          .set({ projectedFantasyPoints: parseFloat(avgPoints.toFixed(2)) })
          .where(eq(players.id, player.id));

        console.log(`[Projections] ${player.name}: ${avgPoints.toFixed(2)} pts/game (${gamesPlayed} games)`);
        updated++;
      } catch (error) {
        console.error(`[Projections] Error processing ${player.name}:`, error);
        skipped++;
      }

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[Projections] Complete: ${updated} updated, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      total: playerList.length,
    });
  } catch (error) {
    console.error('[Projections] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate projections', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
