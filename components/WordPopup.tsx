'use client'

import { useEffect, useState } from 'react'

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
  onClose: () => void
}

export default function WordPopup({ word, position, onClose }: WordPopupProps) {
  const [data, setData] = useState<WordData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWord = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/translate?word=${encodeURIComponent(word)}`)
        const result = await response.json()
        setData(result)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchWord()
  }, [word])

  // 计算位置，防止溢出屏幕
  const left = Math.max(10, Math.min(position.x, window.innerWidth - 230))
  const top = position.y + 10

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
          </div>
        ) : data ? (
          <div className="space-y-2">
            <div>
              <span className="font-bold text-brand-500">{data.word}</span>
              {data.phonetic && (
                <span className="ml-2 text-slate-500">{data.phonetic}</span>
              )}
            </div>

            {data.chinese && (
              <div className="text-slate-400 font-medium">{data.chinese}</div>
            )}

            {data.definition && (
              <div className="text-slate-500 text-[11px]">{data.definition}</div>
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
