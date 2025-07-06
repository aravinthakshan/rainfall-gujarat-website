import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RainfallData from '@/lib/models/RainfallData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const taluka = searchParams.get('taluka');
    
    let query: any = {};
    
    if (date) {
      query.date = date;
    }
    
    if (taluka) {
      query.taluka = { $regex: new RegExp(taluka, 'i') }; // Case-insensitive search
    }
    
    const data = await RainfallData.find(query).sort({ taluka: 1, date: 1 });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching rainfall data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rainfall data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { taluka, rain_till_yesterday, rain_last_24hrs, total_rainfall, percent_against_avg, date } = body;
    
    const rainfallData = new RainfallData({
      taluka,
      rain_till_yesterday: Number(rain_till_yesterday) || 0,
      rain_last_24hrs: Number(rain_last_24hrs) || 0,
      total_rainfall: Number(total_rainfall) || 0,
      percent_against_avg: Number(percent_against_avg) || 0,
      date,
    });
    
    await rainfallData.save();
    
    return NextResponse.json(rainfallData);
  } catch (error) {
    console.error('Error creating rainfall data:', error);
    return NextResponse.json(
      { error: 'Failed to create rainfall data' },
      { status: 500 }
    );
  }
} 