import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo-client';

export const dynamic = 'force-dynamic';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const taluka = searchParams.get('taluka');

    const query: Record<string, unknown> = {};
    if (date) query.date = date;
    if (taluka) query.taluka = { $regex: `^${escape(taluka)}$`, $options: 'i' };

    const data = await db
      .collection('rainfalldatas')
      .find(query, { projection: { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 } })
      .toArray();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching rainfall data:', error);
    return NextResponse.json({ error: 'Failed to fetch rainfall data' }, { status: 500 });
  }
}
