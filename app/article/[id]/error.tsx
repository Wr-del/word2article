'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Article error:', error)
  }, [error])

  return (
    <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 flex items-center justify-center">
      <div className="glass-card rounded-2xl custom-shadow p-8 text-center space-y-4">
        <div style={{ color: '#ef4444' }} className="text-sm font-semibold">文章加载失败</div>
        <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>{error.message || '请检查文章是否存在'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 font-bold text-xs rounded-xl transition-all"
            style={{ background: 'var(--brand-500)', color: '#ffffff' }}
          >
            重试
          </button>
          <Link
            href="/history"
            className="px-5 py-2.5 font-bold text-xs rounded-xl transition-all"
            style={{ background: 'var(--input-bg)', color: 'var(--fg-secondary)', border: '1px solid var(--border)' }}
          >
            历史记录
          </Link>
        </div>
      </div>
    </main>
  )
}
