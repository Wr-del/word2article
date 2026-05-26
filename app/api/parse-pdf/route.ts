import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'temp')
    try {
      await mkdir(tempDir, { recursive: true })
    } catch {
      // Directory might already exist
    }

    // Save file to temp directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempFile = join(tempDir, `pdf_${Date.now()}.pdf`)
    await writeFile(tempFile, buffer)

    try {
      // Call Python script to parse PDF
      const scriptPath = join(process.cwd(), 'scripts', 'pdf_parser.py')
      const { stdout, stderr } = await execAsync(
        `python "${scriptPath}" "${tempFile}"`,
        { timeout: 30000 } // 30 second timeout
      )

      if (stderr) {
        console.error('Python script stderr:', stderr)
      }

      // Parse JSON output
      const words = JSON.parse(stdout.trim())

      return NextResponse.json({ words })
    } finally {
      // Clean up temp file
      try {
        await unlink(tempFile)
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    return NextResponse.json(
      { error: 'Failed to parse PDF' },
      { status: 500 }
    )
  }
}
