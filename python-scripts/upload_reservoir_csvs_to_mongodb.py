import os
import pandas as pd
from pymongo import MongoClient
from datetime import datetime

# Configuration
MONGO_URI = os.environ.get('MONGODB_URI')
if not MONGO_URI:
    raise RuntimeError('Please set the MONGODB_URI environment variable.')
DB_NAME = "rainfall-data"
COLLECTION_NAME = "reservoirdatas"
CSV_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "extracted_data")

# Helper to standardize date format
def standardize_date(date_str):
    # Try to parse various formats and output DD/MM/YYYY
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y", "%d %b %Y", "%d %B %Y"):
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%d/%m/%Y")
        except Exception:
            continue
    return date_str  # fallback

# Helper to clean percentage values
def clean_percentage(value):
    if pd.isna(value) or value == "":
        return 0
    # Remove % symbol and convert to float
    if isinstance(value, str):
        value = value.replace('%', '').strip()
    try:
        return float(value)
    except:
        return 0

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# Process all CSVs in the directory
for fname in os.listdir(CSV_DIR):
    if not fname.lower().endswith(".csv"):
        continue
    fpath = os.path.join(CSV_DIR, fname)
    print(f"Processing {fname} ...")
    df = pd.read_csv(fpath)

    # Try to find a date column or infer date from filename
    date_col = None
    for col in df.columns:
        if "date" in col.lower():
            date_col = col
            break
    if date_col:
        df["date"] = df[date_col].apply(standardize_date)
    else:
        # Try to extract date from filename
        date_guess = None
        for part in fname.replace(".csv", "").replace("_", " ").split():
            try:
                date_guess = standardize_date(part)
                if date_guess != part:
                    break
            except Exception:
                continue
        if date_guess:
            df["date"] = date_guess
        else:
            df["date"] = "01/01/2000"  # fallback

    # Rename "PercentageFilling %" to "PercentageFilling" and clean the values
    if "PercentageFilling %" in df.columns:
        df = df.rename(columns={"PercentageFilling %": "PercentageFilling"})
        df["PercentageFilling"] = df["PercentageFilling"].apply(clean_percentage)

    # Only keep relevant columns - keep "Name of Schemes" as is
    keep_cols = [
        "Name of Schemes", "InflowinCusecs", "OutflowRiverinCusecs", "outflowCanalinCusecs", "PercentageFilling", "date"
    ]
    available_cols = [col for col in keep_cols if col in df.columns]
    df = df[available_cols]
    
    # Filter out rows with NaN Name of Schemes
    df = df.dropna(subset=['Name of Schemes'])

    # Convert to dicts and upload
    records = df.to_dict("records")
    if records:
        result = collection.insert_many(records)
        print(f"Uploaded {len(result.inserted_ids)} records from {fname}")
    else:
        print(f"No records found in {fname}")

print("Done.")
client.close() 