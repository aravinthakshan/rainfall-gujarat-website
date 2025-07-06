import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://aravinth:sahlt2j03Damwzse@blogsmarkdown.66vqnyy.mongodb.net/rainfall-data?retryWrites=true&w=majority&appName=BlogsMarkdown';
const DB_NAME = 'rainfall-data';
const COLLECTION_NAME = 'reservoirdatas';

export async function GET(req: NextRequest) {
  const client = new MongoClient(uri);
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