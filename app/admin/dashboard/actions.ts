"use server"

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { spawn } from "child_process"

export async function uploadMarkdownPost(formData: FormData) {
  try {
    const markdownFile = formData.get("markdown") as File
    if (!markdownFile) {
      throw new Error("No markdown file provided")
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", "posts")
    await mkdir(uploadsDir, { recursive: true })

    // Save markdown file
    const markdownBuffer = Buffer.from(await markdownFile.arrayBuffer())
    const markdownPath = join(uploadsDir, markdownFile.name)
    await writeFile(markdownPath, markdownBuffer)

    // Handle image uploads
    const imageDir = join(uploadsDir, "images")
    await mkdir(imageDir, { recursive: true })

    // Process any uploaded images
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image-") && value instanceof File) {
        const imageBuffer = Buffer.from(await value.arrayBuffer())
        const imagePath = join(imageDir, value.name)
        await writeFile(imagePath, imageBuffer)
      }
    }

    // Here you would typically:
    // 1. Parse the markdown file
    // 2. Extract metadata (title, date, tags)
    // 3. Save to database
    // 4. Generate static pages

    return { success: true, message: "Post uploaded successfully" }
  } catch (error) {
    console.error("Error uploading post:", error)
    throw new Error("Failed to upload post")
  }
}

export async function uploadPDFFile(formData: FormData) {
  try {
    const pdfFile = formData.get("pdf") as File
    const date = formData.get("date") as string

    if (!pdfFile || !date) {
      throw new Error("PDF file and date are required")
    }

    // Convert PDF to data and upload directly to MongoDB (in memory)
    const result = await convertPDFAndUploadToMongoDB(pdfFile, date)

    return { 
      success: true, 
      message: `PDF processed successfully. ${result.recordsCount} records uploaded to MongoDB.`
    }
  } catch (error) {
    console.error("Error processing PDF:", error)
    throw new Error(`Failed to process PDF file: ${error}`)
  }
}

async function convertPDFAndUploadToMongoDB(pdfFile: File, date: string): Promise<{recordsCount: number}> {
  return new Promise(async (resolve, reject) => {
    try {
      // Convert File to base64 for Python processing
      const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
      const pdfBase64 = pdfBuffer.toString('base64')
      
      // Create a Python script to run the parser and upload to MongoDB
      const pythonScript = `
import sys
import os
import base64
import pandas as pd
from pymongo import MongoClient
import tempfile
sys.path.append('${join(process.cwd(), "python-scripts")}')

from parser import FixedRainfallParser

try:
    # Decode base64 PDF data
    pdf_data = base64.b64decode('${pdfBase64}')
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        temp_file.write(pdf_data)
        temp_path = temp_file.name
    
    # Parse PDF to DataFrame
    parser = FixedRainfallParser(debug=False)
    df = parser.process_pdf_to_dataframe(temp_path)
    
    # Clean up temporary file
    os.unlink(temp_path)
    
    if df.empty:
        print("ERROR: No data extracted from PDF")
        sys.exit(1)
    
    # Add date column with standardized format
    df['date'] = '${date}'
    
    # Convert DataFrame to list of dictionaries for MongoDB
    records = df.to_dict('records')
    
    # Connect to MongoDB
    MONGO_URI = os.environ.get('MONGODB_URI')
    if not MONGO_URI:
        print("ERROR: Please set the MONGODB_URI environment variable.")
        sys.exit(1)
    client = MongoClient(MONGO_URI)
    db = client['rainfall-data']
    collection = db['rainfalldatas']
    
    # Insert records into MongoDB
    if records:
        result = collection.insert_many(records)
        print(f"SUCCESS: {len(result.inserted_ids)} records uploaded to MongoDB")
        print(f"RECORDS_COUNT: {len(result.inserted_ids)}")
    else:
        print("WARNING: No records to upload")
        print("RECORDS_COUNT: 0")
    
    client.close()
    
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
`

      // Write the Python script to a temporary file
      const tempScriptPath = join(process.cwd(), "temp_pdf_mongo_script.py")
      
      await writeFile(tempScriptPath, pythonScript)
      
      // Run the Python script
      const pythonProcess = spawn('python', [tempScriptPath])
      
      let output = ''
      let errorOutput = ''
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })
      
      pythonProcess.on('close', async (code) => {
        // Clean up temp script
        try {
          await writeFile(tempScriptPath, '')
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (code === 0) {
          // Extract records count from output
          const recordsMatch = output.match(/RECORDS_COUNT: (\d+)/)
          const recordsCount = recordsMatch ? parseInt(recordsMatch[1]) : 0
          resolve({ recordsCount })
        } else {
          reject(new Error(`PDF processing failed: ${errorOutput || output}`))
        }
      })
      
      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to run Python script: ${error.message}`))
      })
    } catch (error) {
      reject(error)
    }
  })
} 