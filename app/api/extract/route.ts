import { NextRequest, NextResponse } from 'next/server'

const MAX_TEXT_LENGTH = 50_000

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long (max ${MAX_TEXT_LENGTH} characters)` },
        { status: 400 }
      )
    }

    const wordRegex = /[a-zA-Z]+(?:[''-][a-zA-Z]+)*/g
    const matches = text.match(wordRegex) || []

    const words = [...new Set(
      matches
        .map(w => w.toLowerCase())
        .filter(w => w.length >= 2)
    )]

    return NextResponse.json({ words })
  } catch (error) {
    console.error('Extract words error:', error)
    return NextResponse.json(
      { error: 'Failed to extract words' },
      { status: 500 }
    )
  }
}
