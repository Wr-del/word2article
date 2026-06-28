'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { STYLE_LABELS } from '@/lib/constants'
import { useToast } from '@/components/Toast'

interface ArticleSummary {
  id: number
  title: string
  wordCount: number
  difficulty: string
  style: string
  createdAt: string
}

export default function HistoryPage() {
  const toast = useToast()
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
        toast('删除失败，请重试')
      }
    } catch (error) {
      console.error('Delete article error:', error)
      toast('删除失败，请重试')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl w-full mx-auto p-4 flex items-center justify-center">
        <div style={{ color: 'var(--fg-muted)' }} className="text-sm">加载中...</div>
      </main>
    )
  }

  return (
    <main className="max-w-2xl w-full mx-auto p-4 space-y-4 relative z-10">
      <div className="space-y-1 pt-2 pb-1">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>学习足迹</h1>
        <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>你生成的所有文章记录</p>
      </div>

      {articles.length === 0 ? (
        <div className="py-16 text-center rounded-2xl p-8" style={{ border: '1px dashed var(--border)', background: 'var(--input-bg)' }}>
          <svg className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--fg-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs mb-4" style={{ color: 'var(--fg-muted)' }}>暂无历史记录</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200"
            style={{ color: 'var(--brand-500)', background: 'var(--highlight-bg)' }}
          >
            去生成文章
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* 时间线 */}
          <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: 'var(--border)' }}></div>

          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="block relative pl-10 group"
              >
                {/* 时间线节点 */}
                <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 z-10" style={{ borderColor: 'var(--brand-500)', background: 'var(--bg)' }}></div>

                {/* 卡片 */}
                <div className="glass-card p-4 rounded-xl custom-shadow space-y-2 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--highlight-bg)', color: 'var(--brand-500)' }}>
                        {article.difficulty.toUpperCase()}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--input-bg)', color: 'var(--fg-muted)' }}>
                        {STYLE_LABELS[article.style] || '阅读'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(article.id, e)}
                      disabled={deletingId === article.id}
                      className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      style={{ color: 'var(--fg-muted)' }}
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
                  <div className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>{article.title}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }} suppressHydrationWarning>
                      {new Date(article.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>
                      {article.wordCount} 个单词
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
