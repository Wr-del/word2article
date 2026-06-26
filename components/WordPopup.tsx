'use client'

import { useEffect, useState } from 'react'
import { speakWord } from '@/lib/constants'

interface WordData {
  word: string
  phonetic: string | null
  definition: string | null
  chinese: string | null
  example: string | null
}

interface WordPopupProps {
  word: string
  position: { x: number; y: number }
  lookupWord?: string
  originalWord?: string
  deformedWord?: string
  deformationType?: string
  onClose: () => void
}

/**
 * 清理中文释义：去掉词性前缀，只保留核心释义
 * 输入: "vt. 放弃, 抛弃, 遗弃, 使屈从, 沉溺, 放纵 n. 放任, 无拘束, 狂热"
 * 输出: "放弃, 抛弃, 遗弃"
 */
function cleanChinese(raw: string): string {
  if (!raw) return ''
  let s = raw
    .replace(/\[.*?\]/g, '')       // 去掉 [计] [经] 等标记
    .replace(/\(.*?\)/g, '')       // 去掉括号内容
    .replace(/…/g, '')
    .replace(/\.{3,}/g, '')
  // 去掉所有词性前缀
  s = s.replace(/(?:vt\.|vi\.|n\.|a\.|ad\.|prep\.|conj\.|pron\.|int\.|art\.|num\.|aux\.|abbr\.|v\.|r\.|s\.)\s*/g, '')
  // 按逗号/分号/顿号分割，取前3个
  const parts = s.split(/[,，;；、\s]+/).map(p => p.trim()).filter(p => p.length > 0 && p.length < 10)
  return parts.slice(0, 3).join(', ')
}

/**
 * 清理英文释义：去掉词性前缀，截断过长内容
 * 输入: "n. the trait of lacking restraint or control; reckless freedom from inhibition or worry v. forsake, ..."
 * 输出: "the trait of lacking restraint or control"
 */
function cleanDefinition(raw: string): string {
  if (!raw) return ''
  let s = raw
    .replace(/(?:^|\s)(?:vt\.|vi\.|n\.|a\.|ad\.|prep\.|conj\.|pron\.|int\.|art\.|num\.|aux\.|abbr\.|v\.|r\.|s\.)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // 按分号分割，取第一条完整释义
  const parts = s.split(/[;.]/).map(p => p.trim()).filter(p => p.length > 5)
  if (parts.length > 0) s = parts[0]
  if (s.length > 100) s = s.slice(0, 100).replace(/\s+\S*$/, '') + '...'
  return s
}

export default function WordPopup({ word, position, lookupWord, originalWord, deformedWord, deformationType, onClose }: WordPopupProps) {
  const [data, setData] = useState<WordData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  const checkFavorite = async (w: string, signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/favorites`, { signal })
      if (!response.ok) return
      const result = await response.json()
      const exists = result.favorites?.some((f: { word: string }) => f.word === w.toLowerCase())
      setIsFavorite(exists || false)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setIsFavorite(false)
    }
  }

  const toggleFavorite = async () => {
    if (favoriteLoading) return
    setFavoriteLoading(true)

    try {
      if (isFavorite) {
        const res = await fetch(`/api/favorites?word=${encodeURIComponent(word)}`, {
          method: 'DELETE',
        })
        if (res.ok) setIsFavorite(false)
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word,
            phonetic: data?.phonetic,
            definition: data?.definition,
            chinese: data?.chinese,
          }),
        })
        if (res.ok) setIsFavorite(true)
      }
    } catch (err) {
      console.error('Toggle favorite error:', err)
    } finally {
      setFavoriteLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const fetchWord = async () => {
      const queryWord = lookupWord || word
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/translate?word=${encodeURIComponent(queryWord)}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()

        if (result.error) {
          throw new Error(result.error)
        }

        setData(result)
        speakWord(word)

        checkFavorite(queryWord, controller.signal)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('Failed to fetch word:', err)
        setError(err instanceof Error ? err.message : '翻译失败')
        setData(null)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchWord()

    return () => { controller.abort() }
  }, [word, lookupWord])

  // 计算位置，防止溢出屏幕
  const popupWidth = 220
  const popupHeight = 200 // 估算高度
  const left = Math.max(10, Math.min(position.x - popupWidth / 2, window.innerWidth - popupWidth - 10))
  // 如果下方空间不足，显示在上方
  const spaceBelow = window.innerHeight - position.y
  const top = spaceBelow < popupHeight + 20
    ? position.y - popupHeight - 10
    : position.y + 10

  return (
    <div
      className="fixed z-50"
      style={{ left, top }}
    >
      <div className="bg-[#080d19]/90 backdrop-blur-xl text-slate-100 p-3.5 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-slate-800/80 text-xs max-w-[220px] leading-relaxed">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 p-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="text-center py-3">
            <div className="w-4 h-4 rounded-full border border-slate-800 border-t-brand-500 animate-spin mx-auto"></div>
            <div className="text-slate-500 mt-2">翻译中...</div>
          </div>
        ) : error ? (
          <div className="text-center py-3">
            <div className="text-rose-400 mb-1">翻译失败</div>
            <div className="text-slate-600 text-[10px]">{error}</div>
          </div>
        ) : data ? (
          <div className="space-y-2">
            {originalWord && deformedWord && (
              <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-slate-800/60">
                <span className="text-[10px] text-slate-500">{deformedWord}</span>
                <svg className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-[10px] text-brand-500 font-semibold">{originalWord}</span>
                {deformationType && (
                  <span className="text-[9px] bg-brand-500/10 text-brand-500 px-1 py-0.5 rounded font-bold ml-auto">{deformationType}</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-bold text-brand-500">{data.word}</span>
              <button
                onClick={() => speakWord(word)}
                className="p-1 text-slate-500 hover:text-brand-500 transition-colors"
                title="播放发音"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8H4a1 1 0 00-1 1v6a1 1 0 001 1h2.5l4 4V4l-4 4z" />
                </svg>
              </button>
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`p-1 transition-colors ${isFavorite ? 'text-rose-400 hover:text-rose-500' : 'text-slate-500 hover:text-rose-400'}`}
                title={isFavorite ? '取消收藏' : '收藏'}
              >
                <svg className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            {data.phonetic && (
              <div className="text-slate-500">{data.phonetic}</div>
            )}

            {data.chinese && (
              <div className="text-slate-400 font-medium">{cleanChinese(data.chinese)}</div>
            )}

            {data.definition && (
              <div className="text-slate-500 text-[11px]">{cleanDefinition(data.definition)}</div>
            )}

            {data.example && (
              <div className="text-slate-500 text-[11px] italic border-t border-slate-800/60 pt-2 mt-2">
                {data.example}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-3 text-slate-500">暂无释义</div>
        )}
      </div>
    </div>
  )
}
