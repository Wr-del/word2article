import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateArticle, translateArticleToChinese, translateToChinese } from '@/lib/deepseek'
import { lookupWord } from '@/lib/dictionary'
import { STYLE_LABELS } from '@/lib/constants'
import { getUserId } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const { words, difficulty = 'cet4', style = 'story' } = await request.json()

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Words array is required' },
        { status: 400 }
      )
    }

    if (words.length > 50) {
      return NextResponse.json(
        { error: 'Too many words (max 50)' },
        { status: 400 }
      )
    }

    const content = await generateArticle(words, difficulty, style)
    const translation = await translateArticleToChinese(content)
    const title = `${difficulty.toUpperCase()} · ${STYLE_LABELS[style] || '阅读'} - ${new Date().toLocaleDateString('zh-CN')}`

    // 获取每个单词的词典信息
    // 关键改进：无论词典查询是否成功，都调用 DeepSeek 获取中文翻译
    const wordData = await Promise.all(
      words.map(async (word: string) => {
        try {
          // 并行查询词典和 DeepSeek 翻译
          const [dictResult, chinese] = await Promise.all([
            lookupWord(word),
            translateToChinese(word)
          ])

          return {
            word,
            phonetic: dictResult?.phonetic || null,
            definition: dictResult?.definition || null,
            chinese: chinese || null,
            example: dictResult?.example || null,
          }
        } catch (error) {
          console.error(`Error looking up word "${word}":`, error)
          // 即使出错也尝试获取中文翻译
          try {
            const chinese = await translateToChinese(word)
            return {
              word,
              phonetic: null,
              definition: null,
              chinese: chinese || null,
              example: null,
            }
          } catch {
            return {
              word,
              phonetic: null,
              definition: null,
              chinese: null,
              example: null,
            }
          }
        }
      })
    )

    // 创建文章并关联单词
    const userId = await getUserId()
    const article = await prisma.article.create({
      data: {
        title,
        content,
        translation,
        difficulty,
        style,
        userId,
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
