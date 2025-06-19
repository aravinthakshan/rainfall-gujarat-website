import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Path to the public directory
  const publicDir = path.join(process.cwd(), 'public');
  // Read all CSV files
  let files = fs.readdirSync(publicDir)
    .filter((file) => file.endsWith('.csv'))
    .sort((a, b) => {
      // Sort by date prefix (e.g., 1st, 2nd, ... 17th)
      const numA = parseInt(a);
      const numB = parseInt(b);
      return numA - numB;
    });
  return NextResponse.json({ files });
} 