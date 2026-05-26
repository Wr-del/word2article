'use client'

import { useEffect, useState } from 'react'

interface ArticleSummary {
  id: number
  title: string
  wordCount: number
  difficulty: string
  createdAt: string
}

export default function HistoryPage() {
  const [articles, setArticles] = useState<ArticleSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles')
        const data = await response.json()
        setArticles(data.articles)
      } catch (error) {
        console.error('Fetch articles error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </a>
        </div>

        <h1 className="text-3xl font-bold mb-8">历史记录</h1>

        {articles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            还没有生成过文章，去首页试试吧！
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <a
                key={article.id}
                href={`/article/${article.id}`}
                className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{article.title}</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {article.difficulty.toUpperCase()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {article.wordCount} 个单词 · {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
