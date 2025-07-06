import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RainfallData from '@/lib/models/RainfallData';

export async function GET() {
  try {
    await connectDB();
    
    // Get all unique dates from the database
    const dates = await RainfallData.distinct('date');
    
    // Sort dates in chronological order (assuming the date format is consistent)
    const sortedDates = dates.sort((a, b) => {
      // Extract day number from "1st June 2025", "2nd June 2025", etc.
      const dayA = parseInt(a.match(/(\d+)/)?.[1] || '0');
      const dayB = parseInt(b.match(/(\d+)/)?.[1] || '0');
      return dayA - dayB;
    });
    
    return NextResponse.json(sortedDates);
  } catch (error) {
    console.error('Error fetching rainfall dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rainfall dates' },
      { status: 500 }
    );
  }
} 