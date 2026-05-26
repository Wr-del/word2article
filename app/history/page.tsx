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
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [])

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

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault() // 阻止链接跳转
    e.stopPropagation()

    if (!confirm('确定要删除这篇文章吗？删除后无法恢复。')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // 从列表中移除已删除的文章
        setArticles(articles.filter(a => a.id !== id))
      } else {
        alert('删除失败，请重试')
      }
    } catch (error) {
      console.error('Delete article error:', error)
      alert('删除失败，请重试')
    } finally {
      setDeletingId(null)
    }
  }

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
              <div
                key={article.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow relative group"
              >
                <a href={`/article/${article.id}`} className="block">
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
                <button
                  onClick={(e) => handleDelete(article.id, e)}
                  disabled={deletingId === article.id}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除文章"
                >
                  {deletingId === article.id ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
