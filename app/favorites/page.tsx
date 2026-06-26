'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { speakWord } from '@/lib/constants'

interface FavoriteWord {
  id: number
  word: string
  phonetic: string | null
  definition: string | null
  chinese: string | null
  createdAt: string
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteWord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (error) {
      console.error('Fetch favorites error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  const handleRemove = async (word: string) => {
    try {
      const response = await fetch(`/api/favorites?word=${encodeURIComponent(word)}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setFavorites(favorites.filter(f => f.word !== word))
      }
    } catch (error) {
      console.error('Remove favorite error:', error)
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
          <h2 className="text-base font-bold text-slate-200">生词本</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">收藏的单词共 {favorites.length} 个</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="py-16 text-center text-slate-600 border border-dashed border-slate-900 rounded-2xl bg-slate-950/20 p-8">
          <svg className="w-6 h-6 mx-auto mb-2 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-xs mb-4">暂无收藏单词</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand-500 hover:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            去生成文章
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="glass-card p-4 rounded-xl custom-shadow hover:border-slate-800 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-500 text-sm">{fav.word}</span>
                    <button
                      onClick={() => speakWord(fav.word)}
                      className="p-1 text-slate-500 hover:text-brand-500 transition-colors"
                      title="播放发音"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8H4a1 1 0 00-1 1v6a1 1 0 001 1h2.5l4 4V4l-4 4z" />
                      </svg>
                    </button>
                    {fav.phonetic && (
                      <span className="text-slate-500 text-xs">{fav.phonetic}</span>
                    )}
                  </div>
                  {fav.chinese && (
                    <div className="text-slate-400 text-xs">{fav.chinese}</div>
                  )}
                  {fav.definition && (
                    <div className="text-slate-500 text-[11px]">{fav.definition}</div>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(fav.word)}
                  className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all"
                  title="取消收藏"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
