'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ArticleView from '@/components/ArticleView'

interface ArticleData {
  id: number
  title: string
  content: string
  translation: string | null
  difficulty: string
  words: Array<{
    word: string
    phonetic: string | null
    definition: string | null
    chinese: string | null
  }>
}

export default function ArticlePage() {
  const params = useParams()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${params.id}`)
        const data = await response.json()
        setArticle(data.article)
      } catch (error) {
        console.error('Fetch article error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [params.id])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </main>
    )
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-500">文章未找到</div>
      </main>
    )
  }

  const wordList = article.words.map(w => w.word)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{article.title}</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {article.difficulty.toUpperCase()}
            </span>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">本文章包含的单词：</div>
            <div className="flex flex-wrap gap-2">
              {article.words.map((w, i) => (
                <span key={i} className="px-2 py-1 bg-yellow-100 rounded text-sm">
                  {w.word}
                  {w.chinese && <span className="ml-1 text-gray-500">({w.chinese})</span>}
                </span>
              ))}
            </div>
          </div>

          <ArticleView content={article.content} words={wordList} />

          {article.translation && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">中文翻译</h2>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {article.translation}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center space-x-4">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            生成新文章
          </a>
          <a href="/history" className="text-blue-600 hover:text-blue-800 underline">
            历史记录
          </a>
        </div>
      </div>
    </main>
  )
}
