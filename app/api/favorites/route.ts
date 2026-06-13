import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const favorites = await prisma.favorite.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('List favorites error:', error)
    return NextResponse.json(
      { error: 'Failed to list favorites' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { word, phonetic, definition, chinese } = await request.json()

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    const favorite = await prisma.favorite.upsert({
      where: { word: word.toLowerCase() },
      update: { phonetic, definition, chinese },
      create: { word: word.toLowerCase(), phonetic, definition, chinese },
    })

    return NextResponse.json({ favorite })
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    await prisma.favorite.delete({
      where: { word: word.toLowerCase() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    )
  }
}
