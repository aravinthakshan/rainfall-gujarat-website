import os
import sys
from parser import FixedRainfallParser
import pandas as pd
from pymongo import MongoClient
import re

# --- CONFIG ---
PDF_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "csvs")
# MONGO_URI = os.environ.get('MONGODB_URI')
MONGODB_URI="mongodb+srv://aravinth:sahlt2j03Damwzse@blogsmarkdown.66vqnyy.mongodb.net/rainfall-data?retryWrites=true&w=majority&appName=BlogsMarkdown"
MONGO_URI = MONGODB_URI
if not MONGO_URI:
    raise RuntimeError('Please set the MONGODB_URI environment variable.')
DB_NAME = "rainfall-data"
COLLECTION_NAME = "rainfalldatas"

# --- STEP 1: Convert all PDFs to CSVs ---
parser = FixedRainfallParser(debug=False)
for fname in os.listdir(PDF_DIR):
    if fname.lower().endswith(".pdf"):
        pdf_path = os.path.join(PDF_DIR, fname)
        csv_path = pdf_path.replace(".pdf", ".csv")
        print(f"[PDF→CSV] Processing {fname} ...")
        try:
            df = parser.process_pdf_to_dataframe(pdf_path)
            if not df.empty:
                parser.save_to_csv(df, csv_path)
                print(f"[PDF→CSV] Saved CSV: {csv_path}")
            else:
                print(f"[PDF→CSV] No data extracted from {fname}")
        except Exception as e:
            print(f"[PDF→CSV] Error processing {fname}: {e}")

# --- STEP 2: Upload all CSVs to MongoDB ---
def clean_numeric_value(value):
    if pd.isna(value) or value == '' or value == 'nan':
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0

def clean_string_value(value):
    if pd.isna(value) or value == '' or str(value).lower() == 'nan':
        return ''
    return str(value).strip()

def extract_date_from_csv(df, fallback_filename=None):
    # Try to extract date from a 'date' column if present
    if 'date' in df.columns and not df['date'].isnull().all():
        for val in df['date']:
            if pd.notna(val) and str(val).strip() != '':
                return str(val).strip()
    # Fallback: try to extract from filename
    if fallback_filename:
        # Try DD.MM.YYYY
        match = re.search(r'(\d{2}\.\d{2}\.\d{4})', fallback_filename)
        if match:
            return match.group(1)
        # Try formats like '11th June.csv' and convert to '11.06.2025'
        match2 = re.match(r'(\d{1,2})(st|nd|rd|th)?\s+([A-Za-z]+)', fallback_filename)
        if match2:
            day = int(match2.group(1))
            month_str = match2.group(3).lower()
            month_map = {
                'january': '01', 'february': '02', 'march': '03', 'april': '04',
                'may': '05', 'june': '06', 'july': '07', 'august': '08',
                'september': '09', 'october': '10', 'november': '11', 'december': '12'
            }
            month = month_map.get(month_str)
            if month:
                return f"{day:02d}.{month}.2025"
    return None

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# print("[CSV→MongoDB] Clearing existing data from database...")
# result = collection.delete_many({})
# print(f"[CSV→MongoDB] Deleted {result.deleted_count} existing records")

total_records = 0
for fname in os.listdir(PDF_DIR):
    if not fname.lower().endswith('.csv'):
        continue
    path = os.path.join(PDF_DIR, fname)
    try:
        df = pd.read_csv(path)
        date_str = extract_date_from_csv(df, fallback_filename=fname)
        if not date_str:
            print(f"[CSV→MongoDB] Could not extract date from {fname}, skipping.")
            continue
        df["date"] = date_str
        print(f"[CSV→MongoDB] Processing {fname} (date: {date_str}) ...")
        # Remove existing records for this date to avoid duplicates
        collection.delete_many({'date': date_str})
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
            print(f"[CSV→MongoDB] Uploaded {len(records)} records from {fname}")
        else:
            print(f"[CSV→MongoDB] No valid records found in {fname}")
    except Exception as e:
        print(f"[CSV→MongoDB] Error processing {fname}: {e}")
        continue

print(f"[CSV→MongoDB] All files uploaded successfully! Total records: {total_records}")
final_count = collection.count_documents({})
print(f"[CSV→MongoDB] Total records in database: {final_count}")
dates = collection.distinct('date')
print(f"[CSV→MongoDB] Available dates: {sorted(dates)}") 