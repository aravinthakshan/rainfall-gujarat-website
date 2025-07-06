import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside your deployment settings.');
}
const DB_NAME = 'rainfall-data';
const COLLECTION_NAME = 'reservoirdatas';

export async function GET(req: NextRequest) {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const reservoir = searchParams.get('reservoir');

    const query: any = {};
    if (date) query.date = date;
    if (reservoir) query["Name of Schemes"] = reservoir;

    const data = await collection.find(query).toArray();
    return NextResponse.json(data);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
} 