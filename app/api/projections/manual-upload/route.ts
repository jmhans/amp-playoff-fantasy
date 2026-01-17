import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { players } from '@/app/lib/db/schema';
import { eq, or, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface ProjectionInput {
  name: string;
  team: string;
  position: string;
  projected: number;
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Parse input - detect if CSV or JSON
    let projections: ProjectionInput[] = [];

    if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
      // JSON format
      projections = JSON.parse(data);
    } else {
      // CSV format
      const lines = data.trim().split('\n');
      for (const line of lines) {
        // Skip header if present
        if (line.toLowerCase().includes('player') && line.toLowerCase().includes('projected')) {
          continue;
        }

        const parts = line.split(',').map((p: string) => p.trim());
        if (parts.length >= 4) {
          projections.push({
            name: parts[0],
            team: parts[1],
            position: parts[2],
            projected: parseFloat(parts[3]),
          });
        }
      }
    }

    console.log(`[Manual Projections] Processing ${projections.length} players...`);

    let updated = 0;
    let notFound = 0;

    for (const proj of projections) {
      if (isNaN(proj.projected)) {
        console.log(`[Manual Projections] Skipping ${proj.name} - invalid projection: ${proj.projected}`);
        notFound++;
        continue;
      }

      // Find player by name and team (case-insensitive)
      const matchingPlayers = await db
        .select()
        .from(players)
        .where(
          and(
            sql`LOWER(${players.name}) = LOWER(${proj.name})`,
            eq(players.team, proj.team)
          )
        );

      if (matchingPlayers.length === 0) {
        // Try just by name if team didn't match
        const nameOnlyMatch = await db
          .select()
          .from(players)
          .where(sql`LOWER(${players.name}) = LOWER(${proj.name})`)
          .limit(1);

        if (nameOnlyMatch.length === 0) {
          console.log(`[Manual Projections] Player not found: ${proj.name} (${proj.team})`);
          notFound++;
          continue;
        }

        // Update using name-only match
        await db
          .update(players)
          .set({ projectedFantasyPoints: proj.projected })
          .where(eq(players.id, nameOnlyMatch[0].id));

        console.log(`[Manual Projections] Updated ${proj.name}: ${proj.projected} pts`);
        updated++;
      } else {
        // Update using exact match
        await db
          .update(players)
          .set({ projectedFantasyPoints: proj.projected })
          .where(eq(players.id, matchingPlayers[0].id));

        console.log(`[Manual Projections] Updated ${proj.name} (${proj.team}): ${proj.projected} pts`);
        updated++;
      }
    }

    console.log(`[Manual Projections] Complete: ${updated} updated, ${notFound} not found`);

    return NextResponse.json({
      success: true,
      updated,
      notFound,
      total: projections.length,
    });
  } catch (error) {
    console.error('[Manual Projections] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload projections',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
