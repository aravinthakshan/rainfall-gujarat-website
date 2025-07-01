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

export async function uploadCSVFile(formData: FormData) {
  try {
    const csvFile = formData.get("csv") as File
    const date = formData.get("date") as string

    if (!csvFile || !date) {
      throw new Error("CSV file and date are required")
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", "csv")
    await mkdir(uploadsDir, { recursive: true })

    // Save CSV file
    const csvBuffer = Buffer.from(await csvFile.arrayBuffer())
    const csvPath = join(uploadsDir, `${date}-${csvFile.name}`)
    await writeFile(csvPath, csvBuffer)

    // ─────────────────────────────────────────────────────────
    // Placeholder processing: replace with real analysis later
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // ─────────────────────────────────────────────────────────

    return { success: true, message: "CSV file processed successfully" }
  } catch (error) {
    console.error("Error processing CSV:", error)
    throw new Error("Failed to process CSV file")
  }
}
