import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateArticle, translateArticleToChinese } from '@/lib/deepseek'
import { lookupWord } from '@/lib/dictionary'
import { translateToChinese } from '@/lib/deepseek'

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
    const translation = await translateArticleToChinese(content)
    const title = `${difficulty.toUpperCase()} 阅读 - ${new Date().toLocaleDateString('zh-CN')}`

    // 获取每个单词的词典信息
    const wordData = await Promise.all(
      words.map(async (word: string) => {
        try {
          const dictResult = await lookupWord(word)

          if (!dictResult) {
            return {
              word,
              phonetic: null,
              definition: null,
              chinese: null,
              example: null,
            }
          }

          const chinese = dictResult.definition
            ? await translateToChinese(word, dictResult.definition)
            : null

          return {
            word,
            phonetic: dictResult.phonetic || null,
            definition: dictResult.definition || null,
            chinese,
            example: dictResult.example || null,
          }
        } catch (error) {
          console.error(`Error looking up word "${word}":`, error)
          return {
            word,
            phonetic: null,
            definition: null,
            chinese: null,
            example: null,
          }
        }
      })
    )

    // 创建文章并关联单词
    const article = await prisma.article.create({
      data: {
        title,
        content,
        translation,
        difficulty,
        words: {
          create: wordData,
        },
      },
      include: {
        words: true,
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
