import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside your deployment settings.');
}
const DB_NAME = 'rainfall-data';
const COLLECTION_NAME = 'admins';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const client = new MongoClient(uri!);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Hash the password using SHA-256
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Debug print
    console.log("AUTH DEBUG", { email, password, hashedPassword });

    const user = await collection.findOne({ email, password: hashedPassword });
    if (user) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    await client.close();
  }
} 