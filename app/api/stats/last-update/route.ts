import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { systemSettings } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get the last stats update timestamp
    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'last_stats_update'))
      .limit(1);

    const lastUpdated = result.length > 0 ? result[0].value : null;

    return NextResponse.json({
      lastUpdated,
      canRefresh: lastUpdated 
        ? (Date.now() - new Date(lastUpdated).getTime()) > 10 * 60 * 1000 // 10 minutes
        : true,
    });
  } catch (error) {
    console.error('Error fetching last update time:', error);
    return NextResponse.json(
      { error: 'Failed to fetch last update time' },
      { status: 500 }
    );
  }
}
