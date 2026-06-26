'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 flex items-center justify-center">
      <div className="glass-card rounded-2xl custom-shadow p-8 text-center space-y-4">
        <div className="text-rose-400 text-sm font-semibold">出了点问题</div>
        <p className="text-slate-500 text-xs">{error.message || '页面加载失败，请重试'}</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
        >
          重试
        </button>
      </div>
    </main>
  )
}
