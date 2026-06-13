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
      orderBy: { id: 'desc' },
    })

    // 如果缓存完整（有中文翻译和音标），直接返回
    if (cached && cached.chinese && cached.phonetic) {
      return NextResponse.json({
        word: cached.word,
        phonetic: cached.phonetic,
        definition: cached.definition,
        chinese: cached.chinese,
        example: cached.example,
      })
    }

    // 并行查询本地词典/远程词典和翻译
    const [dictResult, chinese] = await Promise.all([
      lookupWord(normalizedWord),
      cached?.chinese ? Promise.resolve(cached.chinese) : translateToChinese(normalizedWord),
    ])

    // 尝试更新或创建缓存
    try {
      // 查找或创建缓存文章
      let cacheArticle = await prisma.article.findFirst({
        where: { title: '__cache__' },
      })

      if (!cacheArticle) {
        cacheArticle = await prisma.article.create({
          data: {
            title: '__cache__',
            content: 'This is a cache article for storing word translations.',
            difficulty: 'cet4',
          },
        })
      }

      // 如果有旧缓存，更新它；否则创建新记录
      if (cached) {
        await prisma.word.update({
          where: { id: cached.id },
          data: {
            phonetic: dictResult?.phonetic ?? cached.phonetic,
            definition: dictResult?.definition ?? cached.definition,
            chinese: chinese ?? cached.chinese,
            example: dictResult?.example ?? cached.example,
          },
        })
      } else {
        await prisma.word.create({
          data: {
            word: normalizedWord,
            phonetic: dictResult?.phonetic ?? null,
            definition: dictResult?.definition ?? null,
            chinese: chinese ?? null,
            example: dictResult?.example ?? null,
            articleId: cacheArticle.id,
          },
        })
      }
    } catch (cacheError) {
      console.error('Failed to cache translation:', cacheError)
    }

    // 返回完整数据
    return NextResponse.json({
      word: normalizedWord,
      phonetic: dictResult?.phonetic ?? cached?.phonetic ?? null,
      definition: dictResult?.definition ?? cached?.definition ?? null,
      chinese: chinese ?? cached?.chinese ?? null,
      example: dictResult?.example ?? cached?.example ?? null,
    })
  } catch (error) {
    console.error('Translate error:', error)
    return NextResponse.json(
      { error: 'Failed to translate word' },
      { status: 500 }
    )
  }
}
