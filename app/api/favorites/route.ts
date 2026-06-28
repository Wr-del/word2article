import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    const word = request.nextUrl.searchParams.get('word')

    // 单词检查模式：GET /api/favorites?word=xxx
    if (word) {
      const favorite = await prisma.favorite.findFirst({
        where: {
          word: word.toLowerCase(),
          userId: userId ?? null,
        },
        select: { id: true },
      })
      return NextResponse.json({ isFavorite: !!favorite })
    }

    // 全量列表模式：GET /api/favorites
    const favorites = await prisma.favorite.findMany({
      where: { userId: userId ?? null },
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
    const userId = await getUserId()
    const { word, phonetic, definition, chinese } = await request.json()

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    const lowerWord = word.toLowerCase()

    // 查找是否已存在
    const existing = await prisma.favorite.findFirst({
      where: { word: lowerWord, userId: userId ?? null },
    })

    let favorite
    if (existing) {
      favorite = await prisma.favorite.update({
        where: { id: existing.id },
        data: { phonetic, definition, chinese },
      })
    } else {
      favorite = await prisma.favorite.create({
        data: { word: lowerWord, phonetic, definition, chinese, userId },
      })
    }

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
    const userId = await getUserId()
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    const existing = await prisma.favorite.findFirst({
      where: { word: word.toLowerCase(), userId: userId ?? null },
    })

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    )
  }
}
