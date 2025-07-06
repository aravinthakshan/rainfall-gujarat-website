# MongoDB Setup Guide

This guide will help you migrate from CSV files to MongoDB for the rainfall data.

## Prerequisites

1. **MongoDB Installation**: You need MongoDB installed and running locally, or a MongoDB Atlas account.

2. **Environment Variables**: Create a `.env.local` file in the root directory with your MongoDB connection string:

```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/rainfall-data

# For MongoDB Atlas (replace with your actual connection string)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rainfall-data
```

## Setup Steps

### 1. Install Dependencies
The MongoDB dependencies have already been installed:
- `mongodb` - MongoDB driver
- `mongoose` - MongoDB ODM
- `tsx` - TypeScript execution (for migration script)

### 2. Start MongoDB
If using local MongoDB:
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or if using MongoDB Community Edition
mongod
```

### 3. Run Migration Script
Migrate your existing CSV files to MongoDB:
```bash
npm run migrate-csv
```

This script will:
- Connect to MongoDB
- Clear any existing rainfall data
- Read all CSV files from the `public` directory
- Import the data into MongoDB with proper schema

### 4. Start the Development Server
```bash
npm run dev
```

The maps page will now fetch data from MongoDB instead of CSV files.

## API Endpoints

The following API endpoints are now available:

- `GET /api/rainfall-dates` - Get all available dates
- `GET /api/rainfall-data` - Get all rainfall data
- `GET /api/rainfall-data?date=16th June` - Get data for a specific date
- `GET /api/rainfall-data?taluka=ahmedabad` - Get data for a specific taluka
- `POST /api/rainfall-data` - Add new rainfall data

## Database Schema

The rainfall data is stored with the following schema:
```typescript
{
  taluka: string,
  rain_till_yesterday: number,
  rain_last_24hrs: number,
  total_rainfall: number,
  percent_against_avg: number,
  date: string, // e.g., "16th June"
  createdAt: Date,
  updatedAt: Date
}
```

## Benefits of MongoDB Migration

1. **Better Performance**: No need to read large CSV files on every request
2. **Scalability**: Can handle larger datasets efficiently
3. **Query Flexibility**: Can filter and aggregate data easily
4. **Real-time Updates**: Can add new data without file system operations
5. **Data Integrity**: Schema validation and constraints

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running
- Check your connection string in `.env.local`
- For Atlas, ensure your IP is whitelisted

### Migration Issues
- Check that CSV files exist in the `public` directory
- Ensure CSV files have the correct format with headers
- Check MongoDB connection before running migration

### Data Not Loading
- Check browser console for API errors
- Verify API endpoints are working
- Ensure data was migrated successfully 