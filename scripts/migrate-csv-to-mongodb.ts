import fs from 'fs';
import path from 'path';
import connectDB from '../lib/mongodb';
import RainfallData from '../lib/models/RainfallData';

const csvFilesList = [
  "1st June.csv",
  "2nd June.csv",
  "3rd June.csv",
  "4th June.csv",
  "6th June.csv",
  "7th June.csv",
  "8th June.csv",
  "9th June.csv",
  "10th June.csv",
  "11th June.csv",
  "12th June.csv",
  "13th June.csv",
  "14th June.csv",
  "15th June.csv",
  "16th June.csv",
  "17th June.csv",
  "18th June.csv",
];

async function migrateCSVToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB successfully!');

    // Clear existing data
    console.log('Clearing existing rainfall data...');
    await RainfallData.deleteMany({});
    console.log('Existing data cleared.');

    let totalRecords = 0;

    for (const filename of csvFilesList) {
      console.log(`Processing ${filename}...`);
      
      const filePath = path.join(process.cwd(), 'public', filename);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`File ${filename} not found, skipping...`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        console.warn(`File ${filename} is empty or has no data, skipping...`);
        continue;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const dataLines = lines.slice(1);

      const date = filename.replace('.csv', '');

      for (const line of dataLines) {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        if (!row.taluka) {
          console.warn(`Skipping row without taluka: ${line}`);
          continue;
        }

        const rainfallData = new RainfallData({
          taluka: row.taluka,
          rain_till_yesterday: Number(row.rain_till_yesterday) || 0,
          rain_last_24hrs: Number(row.rain_last_24hrs) || 0,
          total_rainfall: Number(row.total_rainfall) || 0,
          percent_against_avg: Number(row.percent_against_avg) || 0,
          date: date,
        });

        await rainfallData.save();
        totalRecords++;
      }

      console.log(`Processed ${filename}: ${dataLines.length} records`);
    }

    console.log(`Migration completed! Total records imported: ${totalRecords}`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateCSVToMongoDB(); 