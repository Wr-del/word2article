import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const wordRegex = /[a-zA-Z]+/g
    const matches = text.match(wordRegex) || []

    const words = [...new Set(
      matches
        .map(w => w.toLowerCase())
        .filter(w => w.length >= 2)
    )]

    return NextResponse.json({ words })
  } catch {
    return NextResponse.json(
      { error: 'Failed to extract words' },
      { status: 500 }
    )
  }
}
