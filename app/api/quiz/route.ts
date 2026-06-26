import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')

    if (!articleId || isNaN(Number(articleId))) {
      return NextResponse.json(
        { error: 'Valid articleId is required' },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: parseInt(articleId) },
      include: { words: true },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const words = article.words.filter(w => w.chinese).slice(0, 10)
    
    const questions = words.map((word, index) => {
      const otherWords = shuffle(
        article.words.filter(w => w.id !== word.id && w.chinese)
      ).slice(0, 3)

      const options = shuffle([
        { word: word.word, chinese: word.chinese, isCorrect: true },
        ...otherWords.map(w => ({ word: w.word, chinese: w.chinese, isCorrect: false })),
      ])

      return {
        id: index + 1,
        word: word.word,
        phonetic: word.phonetic,
        chinese: word.chinese,
        options,
      }
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Generate quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}
