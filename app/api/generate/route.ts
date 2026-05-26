import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateArticle } from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    const { words, difficulty = 'cet4' } = await request.json()

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Words array is required' },
        { status: 400 }
      )
    }

    const content = await generateArticle(words, difficulty)
    const title = `${difficulty.toUpperCase()} 阅读 - ${new Date().toLocaleDateString('zh-CN')}`

    const article = await prisma.article.create({
      data: {
        title,
        content,
        difficulty,
      },
    })

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
      },
    })
  } catch (error) {
    console.error('Generate article error:', error)
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    )
  }
}
