import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { words: true },
        },
      },
    })

    return NextResponse.json({
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        wordCount: article._count.words,
        difficulty: article.difficulty,
        createdAt: article.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('List articles error:', error)
    return NextResponse.json(
      { error: 'Failed to list articles' },
      { status: 500 }
    )
  }
}
