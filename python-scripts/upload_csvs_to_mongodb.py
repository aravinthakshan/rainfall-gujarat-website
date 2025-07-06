import os
import pandas as pd
from pymongo import MongoClient
import re

MONGO_URI = os.environ.get('MONGODB_URI')
if not MONGO_URI:
    raise RuntimeError('Please set the MONGODB_URI environment variable.')
DB_NAME = "rainfall-data"
COLLECTION_NAME = "rainfalldatas"

# Directory containing your PDF/CSV files
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "Rainfall")

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

def extract_date_from_filename(filename):
    # Assumes date is the last part before .pdf, e.g. ...21.06.2025.pdf
    match = re.search(r'(\d{2}\.\d{2}\.\d{4})\.pdf$', filename)
    if match:
        return match.group(1)
    return None

def main():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # Clear existing data
    print("Clearing existing data from database...")
    result = collection.delete_many({})
    print(f"Deleted {result.deleted_count} existing records")

    total_records = 0

    for filename in os.listdir(DATA_DIR):
        if not filename.lower().endswith('.csv'):
            continue
        path = os.path.join(DATA_DIR, filename)
        date_str = extract_date_from_filename(filename)
        if not date_str:
            print(f"Could not extract date from filename: {filename}")
            continue
        print(f"Processing {filename} (date: {date_str}) ...")
        try:
            df = pd.read_csv(path)
            df["date"] = date_str
            records = []
            for _, row in df.iterrows():
                if pd.isna(row.get('taluka')) or str(row.get('taluka')).strip() == '':
                    continue
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
                    'date': date_str
                }
                if record['taluka'] and record['taluka'] != '':
                    records.append(record)
            if records:
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

    print(f"All files uploaded successfully! Total records: {total_records}")
    final_count = collection.count_documents({})
    print(f"Total records in database: {final_count}")
    dates = collection.distinct('date')
    print(f"Available dates: {sorted(dates)}")

if __name__ == "__main__":
    main() 