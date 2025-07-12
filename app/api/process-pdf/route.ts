import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const date = formData.get('date') as string

    if (!pdfFile || !date) {
      return NextResponse.json(
        { error: 'PDF file and date are required' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (pdfFile.size > maxSize) {
      return NextResponse.json(
        { error: 'PDF file size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // For now, return a message that Python processing is required
    // This can be extended with client-side PDF parsing in the future
    return NextResponse.json({
      error: 'PDF processing requires Python dependencies. Please ensure Python and required packages are installed in the production environment.',
      suggestion: 'Consider using the Python-based upload or implementing client-side PDF parsing.'
    }, { status: 501 })

  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 