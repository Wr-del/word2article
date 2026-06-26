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
        <div className="text-rose-400 text-sm font-semibold">文章加载失败</div>
        <p className="text-slate-500 text-xs">{error.message || '请检查文章是否存在'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            重试
          </button>
          <Link
            href="/history"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
          >
            历史记录
          </Link>
        </div>
      </div>
    </main>
  )
}
