#!/usr/bin/env python3
import pandas as pd
import os
from pymongo import MongoClient

# Configuration
MONGO_URI = os.environ.get('MONGODB_URI')
if not MONGO_URI:
    raise RuntimeError('Please set the MONGODB_URI environment variable.')
DB_NAME = "rainfall-data"
COLLECTION_NAME = "reservoirdatas"

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# Test 1: Check if data exists
print("=== Test 1: Data Count ===")
total_count = collection.count_documents({})
print(f"Total documents in collection: {total_count}")

# Test 2: Check sample data structure
print("\n=== Test 2: Sample Data Structure ===")
sample_doc = collection.find_one({})
if sample_doc:
    print("Sample document keys:", list(sample_doc.keys()))
    print("Sample document:", sample_doc)

# Test 3: Check specific reservoir mapping
print("\n=== Test 3: Reservoir Mapping Test ===")
thebi_data = collection.find({"Name of Schemes": "Thebi"}).limit(5)
thebi_count = 0
for doc in thebi_data:
    thebi_count += 1
    print(f"Thebi data {thebi_count}: {doc}")
    if thebi_count >= 3:  # Show first 3 records
        break

print(f"Found {thebi_count} records for Thebi reservoir")

# Test 4: Check date range
print("\n=== Test 4: Date Range ===")
dates = collection.distinct("date")
print(f"Available dates: {len(dates)}")
print(f"Sample dates: {dates[:5]}")

# Test 5: Check metric values
print("\n=== Test 5: Metric Values ===")
latest_date = max(dates) if dates else None
if latest_date:
    latest_data = collection.find({"date": latest_date}).limit(3)
    for doc in latest_data:
        print(f"Reservoir: {doc.get('Name of Schemes')}")
        print(f"  PercentageFilling: {doc.get('PercentageFilling')}")
        print(f"  InflowinCusecs: {doc.get('InflowinCusecs')}")
        print(f"  OutflowRiverinCusecs: {doc.get('OutflowRiverinCusecs')}")
        print(f"  outflowCanalinCusecs: {doc.get('outflowCanalinCusecs')}")
        print()

client.close()
print("Test completed!") 