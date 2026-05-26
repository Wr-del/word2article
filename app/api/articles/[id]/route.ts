import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id },
      include: { words: true },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        difficulty: article.difficulty,
        createdAt: article.createdAt.toISOString(),
        words: article.words.map(word => ({
          id: word.id,
          word: word.word,
          phonetic: word.phonetic,
          definition: word.definition,
          chinese: word.chinese,
          example: word.example,
        })),
      },
    })
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json(
      { error: 'Failed to get article' },
      { status: 500 }
    )
  }
}
