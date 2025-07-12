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
  let pdfFile: File | null = null
  let fileName = 'unknown'
  
  try {
    pdfFile = formData.get("pdf") as File
    const date = formData.get("date") as string

    if (!pdfFile || !date) {
      throw new Error("PDF file and date are required")
    }

    fileName = pdfFile.name

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (pdfFile.size > maxSize) {
      throw new Error("PDF file size must be less than 10MB")
    }

    // Validate file type
    if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
      throw new Error("File must be a PDF")
    }

    // Log processing start
    console.log(`[PDF Processing] Starting: ${fileName}, Size: ${pdfFile.size} bytes, Date: ${date}`)
    const startTime = Date.now()

    // Convert PDF to data and upload directly to MongoDB (in memory)
    const result = await convertPDFAndUploadToMongoDB(pdfFile, date)

    const processingTime = Date.now() - startTime
    console.log(`[PDF Processing] Success: ${fileName}, Records: ${result.recordsCount}, Time: ${processingTime}ms`)

    return { 
      success: true, 
      message: `PDF processed successfully. ${result.recordsCount} records uploaded to MongoDB in ${processingTime}ms.`
    }
  } catch (error) {
    console.error(`[PDF Processing] Error: ${fileName}, ${error}`)
    throw new Error(`Failed to process PDF file: ${error}`)
  }
}

async function convertPDFAndUploadToMongoDB(pdfFile: File, date: string): Promise<{recordsCount: number}> {
  return new Promise(async (resolve, reject) => {
    try {
      // Convert File to base64 for Python processing
      const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
      const pdfBase64 = pdfBuffer.toString('base64')
      
      // Create a more robust Python script with better error handling
      const pythonScript = `
import sys
import os
import base64
import tempfile
import traceback

# Add the python-scripts directory to the path
script_dir = os.path.dirname(os.path.abspath(__file__))
python_scripts_dir = os.path.join(script_dir, 'python-scripts')
sys.path.insert(0, python_scripts_dir)

try:
    # Check if required packages are available
    try:
        import pandas as pd
        from pymongo import MongoClient
        import pdfplumber
    except ImportError as e:
        print(f"ERROR: Missing required Python package: {e}")
        print("ERROR: Please install required packages: pip install pandas pymongo pdfplumber")
        sys.exit(1)
    
    # Import our parser
    try:
        from parser import FixedRainfallParser
    except ImportError as e:
        print(f"ERROR: Could not import parser: {e}")
        sys.exit(1)
    
    # Decode base64 PDF data
    try:
        pdf_data = base64.b64decode('${pdfBase64}')
    except Exception as e:
        print(f"ERROR: Failed to decode PDF data: {e}")
        sys.exit(1)
    
    # Create temporary file
    temp_file = None
    try:
        temp_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        temp_file.write(pdf_data)
        temp_file.close()
        temp_path = temp_file.name
    except Exception as e:
        print(f"ERROR: Failed to create temporary file: {e}")
        sys.exit(1)
    
    # Parse PDF to DataFrame
    try:
        parser = FixedRainfallParser(debug=False)
        df = parser.process_pdf_to_dataframe(temp_path)
    except Exception as e:
        print(f"ERROR: Failed to parse PDF: {e}")
        print(f"ERROR: Traceback: {traceback.format_exc()}")
        if temp_file:
            try:
                os.unlink(temp_path)
            except:
                pass
        sys.exit(1)
    finally:
        # Clean up temporary file
        if temp_file:
            try:
                os.unlink(temp_path)
            except:
                pass
    
    if df.empty:
        print("ERROR: No data extracted from PDF")
        sys.exit(1)
    
    # Add date column with standardized format
    df['date'] = '${date}'
    
    # Convert DataFrame to list of dictionaries for MongoDB
    records = df.to_dict('records')
    
    # Connect to MongoDB
    try:
        MONGO_URI = os.environ.get('MONGODB_URI')
        if not MONGO_URI:
            print("ERROR: Please set the MONGODB_URI environment variable.")
            sys.exit(1)
        
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
        # Test connection
        client.admin.command('ping')
        
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
        print(f"ERROR: MongoDB connection/insertion failed: {e}")
        print(f"ERROR: Traceback: {traceback.format_exc()}")
        sys.exit(1)
    
except Exception as e:
    print(f"ERROR: Unexpected error: {e}")
    print(f"ERROR: Traceback: {traceback.format_exc()}")
    sys.exit(1)
`

      // For production environments with read-only file systems, use in-memory processing
      // or write to /tmp directory which is typically writable
      const tempScriptPath = process.env.NODE_ENV === 'production' 
        ? '/tmp/temp_pdf_mongo_script.py'
        : join(process.cwd(), "temp_pdf_mongo_script.py")
      
      try {
        await writeFile(tempScriptPath, pythonScript)
      } catch (error: any) {
        // If we can't write to file system, use a different approach
        if (error.code === 'EROFS' || error.code === 'EACCES') {
          throw new Error("Production environment has read-only file system. PDF processing requires a writable environment. Please contact administrator to configure Python processing.")
        }
        throw error
      }
      
      // Try different Python commands for production environments
      const pythonCommands = ['python3', 'python', 'py']
      let pythonProcess = null
      let pythonCommand = null
      
      for (const cmd of pythonCommands) {
        try {
          // Test if command exists
          const testProcess = spawn(cmd, ['--version'])
          await new Promise((resolve, reject) => {
            testProcess.on('close', (code) => {
              if (code === 0) {
                pythonCommand = cmd
                resolve(null)
              } else {
                reject(new Error(`Command ${cmd} not available`))
              }
            })
            testProcess.on('error', () => reject(new Error(`Command ${cmd} not available`)))
          })
          break
        } catch (e) {
          continue
        }
      }
      
      if (!pythonCommand) {
        throw new Error("Python is not available. Please install Python 3.7+ and required packages.")
      }
      
      // Run the Python script
      pythonProcess = spawn(pythonCommand, [tempScriptPath])
      
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
          const errorMessage = errorOutput || output || `Python script exited with code ${code}`
          reject(new Error(`PDF processing failed: ${errorMessage}`))
        }
      })
      
      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to run Python script: ${error.message}`))
      })
      
      // Set timeout for the Python process
      setTimeout(() => {
        if (pythonProcess && !pythonProcess.killed) {
          pythonProcess.kill()
          reject(new Error("PDF processing timed out after 60 seconds"))
        }
      }, 60000) // 60 second timeout
      
    } catch (error) {
      reject(error)
    }
  })
} 