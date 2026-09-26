import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo-client';
import { sortDates } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const dates = await db.collection('reservoirdatas').distinct('date');
    return NextResponse.json(sortDates(dates as string[]));
  } catch (error) {
    console.error('Error fetching reservoir dates:', error);
    return NextResponse.json({ error: 'Failed to fetch reservoir dates' }, { status: 500 });
  }
}
