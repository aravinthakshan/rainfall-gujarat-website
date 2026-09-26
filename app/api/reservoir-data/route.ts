import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const reservoir = searchParams.get('reservoir');

    const query: Record<string, string> = {};
    if (date) query.date = date;
    if (reservoir) query["Name of Schemes"] = reservoir;

    const data = await db.collection('reservoirdatas').find(query, { projection: { _id: 0 } }).toArray();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching reservoir data:', error);
    return NextResponse.json({ error: 'Failed to fetch reservoir data' }, { status: 500 });
  }
}
