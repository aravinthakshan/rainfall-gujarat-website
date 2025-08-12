"use server"

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

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
  try {
    // Call the Render microservice instead of running Python locally
    const formData = new FormData()
    formData.append('pdf_file', pdfFile)
    formData.append('date', date)
    
    console.log(`[PDF Processing] Calling Render service for: ${pdfFile.name}`)
    
    const response = await fetch('https://railway-microservice-srip-1.onrender.com/process-pdf', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Render service error: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`PDF processing failed: ${result.message}`)
    }
    
    console.log(`[PDF Processing] Render service processed: ${result.records_count} records`)
    
    return { recordsCount: result.records_count }
    
  } catch (error) {
    console.error(`[PDF Processing] Error calling Render service:`, error)
    throw new Error(`Failed to process PDF via Render service: ${error}`)
  }
}
      
 