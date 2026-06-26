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
        translation: article.translation,
        difficulty: article.difficulty,
        style: article.style,
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

export async function DELETE(
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

    // 删除文章（关联的单词会因为 onDelete: Cascade 自动删除）
    try {
      await prisma.article.delete({ where: { id } })
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2025') {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      throw err
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete article error:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}
