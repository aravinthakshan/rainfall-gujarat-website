import os
import pandas as pd
from pymongo import MongoClient

MONGO_URI = os.environ.get('MONGODB_URI')
if not MONGO_URI:
    raise RuntimeError('Please set the MONGODB_URI environment variable.')
DB_NAME = "rainfall-data"

# Directory containing your CSVs
CSV_DIR = "/home/aravinthakshan/Projects/rainfall-website-final/public"

# List of CSV files with 2025 dates
csv_files = [
    "1st June.csv", "2nd June.csv", "3rd June.csv", "4th June.csv",
    "6th June.csv", "7th June.csv", "8th June.csv", "9th June.csv",
    "10th June.csv", "11th June.csv", "12th June.csv", "13th June.csv",
    "14th June.csv", "15th June.csv", "16th June.csv", "17th June.csv", "18th June.csv"
]

def clean_numeric_value(value):
    """Clean and convert numeric values, handling NaN and empty strings"""
    if pd.isna(value) or value == '' or value == 'nan':
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0

def clean_string_value(value):
    """Clean string values, handling NaN and empty strings"""
    if pd.isna(value) or value == '' or str(value).lower() == 'nan':
        return ''
    return str(value).strip()

def main():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # Clear existing data
    print("Clearing existing data from database...")
    result = collection.delete_many({})
    print(f"Deleted {result.deleted_count} existing records")

    total_records = 0

    for filename in csv_files:
        path = os.path.join(CSV_DIR, filename)
        if not os.path.exists(path):
            print(f"File not found: {filename}")
            continue

        print(f"Processing {filename}...")
        
        try:
            # Read CSV with explicit data types
            df = pd.read_csv(path)
            
            # Add the date field with 2025 year
            date_with_year = filename.replace(".csv", "") + " 2025"
            df["date"] = date_with_year
            
            # Clean and process the data
            records = []
            for _, row in df.iterrows():
                # Skip rows without taluka information
                if pd.isna(row.get('taluka')) or str(row.get('taluka')).strip() == '':
                    continue
                
                # Clean and validate the record
                record = {
                    'region': clean_string_value(row.get('region', '')),
                    'district': clean_string_value(row.get('district', '')),
                    'sr_no': clean_numeric_value(row.get('sr_no', 0)),
                    'taluka': clean_string_value(row.get('taluka', '')),
                    'avg_rain_1995_2024': clean_numeric_value(row.get('avg_rain_1995_2024', 0)),
                    'rain_till_yesterday': clean_numeric_value(row.get('rain_till_yesterday', 0)),
                    'rain_last_24hrs': clean_numeric_value(row.get('rain_last_24hrs', 0)),
                    'total_rainfall': clean_numeric_value(row.get('total_rainfall', 0)),
                    'percent_against_avg': clean_numeric_value(row.get('percent_against_avg', 0)),
                    'date': date_with_year
                }
                
                # Only add records with valid taluka names
                if record['taluka'] and record['taluka'] != '':
                    records.append(record)
            
            if records:
                # Insert records in batches for better performance
                batch_size = 100
                for i in range(0, len(records), batch_size):
                    batch = records[i:i + batch_size]
                    collection.insert_many(batch)
                
                total_records += len(records)
                print(f"Uploaded {len(records)} records from {filename}")
            else:
                print(f"No valid records found in {filename}")
                
        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")
            continue

    print(f"All CSVs uploaded successfully! Total records: {total_records}")
    
    # Verify the upload
    final_count = collection.count_documents({})
    print(f"Total records in database: {final_count}")
    
    # Show sample of dates
    dates = collection.distinct('date')
    print(f"Available dates: {sorted(dates)}")

if __name__ == "__main__":
    main() 