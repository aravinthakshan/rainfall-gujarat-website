import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo-client';
import { sortDates } from '@/lib/dates';

export const dynamic = 'force-dynamic';

// Freshness info for the site header and admin page.
export async function GET() {
  try {
    const db = await getDb();
    const [rainDates, resDates, lastRun] = await Promise.all([
      db.collection('rainfalldatas').distinct('date'),
      db.collection('reservoirdatas').distinct('date'),
      db.collection('ingestruns').find({}, { projection: { _id: 0 } }).sort({ ranAt: -1 }).limit(1).next(),
    ]);
    const r = sortDates(rainDates as string[]);
    const s = sortDates(resDates as string[]);
    return NextResponse.json({
      rainfall: { latest: r.at(-1) ?? null, days: r.length },
      reservoir: { latest: s.at(-1) ?? null, days: s.length },
      lastRun,
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
