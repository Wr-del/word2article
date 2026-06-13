'use client'

import { useEffect, useState } from 'react'

const STYLE_LABELS: Record<string, string> = { story: '故事', news: '新闻', science: '科普', dialogue: '对话' }

interface ArticleSummary {
  id: number
  title: string
  wordCount: number
  difficulty: string
  style: string
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
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Fetch articles error:', error)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
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
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 flex items-center justify-center">
        <div className="text-slate-400 text-sm">加载中...</div>
      </main>
    )
  }

  return (
    <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 space-y-6 relative z-10">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-200">复习历史</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">您此前生成的所有文章记录</p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="py-16 text-center text-slate-600 border border-dashed border-slate-900 rounded-2xl bg-slate-950/20 p-8">
          <svg className="w-6 h-6 mx-auto mb-2 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs">暂无历史记录，去首页生成文章吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article, idx) => (
            <a
              key={article.id}
              href={`/article/${article.id}`}
              className="block glass-card p-4 rounded-xl custom-shadow space-y-3 relative group hover:border-slate-800 transition-all duration-300 cursor-pointer"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-950 border border-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold">
                    {article.difficulty.toUpperCase()}
                  </span>
                  <span className="text-[10px] bg-slate-950 border border-slate-900 text-slate-500 px-2 py-0.5 rounded font-bold">
                    {STYLE_LABELS[article.style] || '阅读'}
                  </span>
                  <span className="text-[10px] text-slate-600" suppressHydrationWarning>
                    {new Date(article.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(article.id, e)}
                  disabled={deletingId === article.id}
                  className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all"
                  title="删除"
                >
                  {deletingId === article.id ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-400 font-medium">{article.title}</div>
              <div className="text-[10px] text-slate-600">{article.wordCount} 个单词</div>
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
