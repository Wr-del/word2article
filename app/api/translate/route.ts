import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lookupWord } from '@/lib/dictionary'
import { translateToChinese } from '@/lib/deepseek'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')

    if (!word) {
      return NextResponse.json(
        { error: 'Word parameter is required' },
        { status: 400 }
      )
    }

    const normalizedWord = word.toLowerCase().trim()

    // 先查缓存
    const cached = await prisma.word.findFirst({
      where: { word: normalizedWord },
    })

    if (cached) {
      return NextResponse.json({
        word: cached.word,
        phonetic: cached.phonetic,
        definition: cached.definition,
        chinese: cached.chinese,
        example: cached.example,
      })
    }

    // 查 Free Dictionary API
    const dictResult = await lookupWord(normalizedWord)

    // 调用 DeepSeek 翻译
    const chinese = await translateToChinese(
      normalizedWord,
      dictResult?.definition ?? ''
    )

    // 保存到缓存
    const wordEntry = await prisma.word.create({
      data: {
        word: normalizedWord,
        phonetic: dictResult?.phonetic ?? null,
        definition: dictResult?.definition ?? null,
        chinese,
        example: dictResult?.example ?? null,
        articleId: 0, // 通用缓存
      },
    })

    return NextResponse.json({
      word: wordEntry.word,
      phonetic: wordEntry.phonetic,
      definition: wordEntry.definition,
      chinese: wordEntry.chinese,
      example: wordEntry.example,
    })
  } catch (error) {
    console.error('Translate error:', error)
    return NextResponse.json(
      { error: 'Failed to translate word' },
      { status: 500 }
    )
  }
}
