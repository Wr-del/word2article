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

  return (
    <div
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
    >
      <div className="bg-white rounded-lg shadow-xl border p-4 max-w-sm relative -translate-x-1/2 mt-2">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {loading ? (
          <div className="text-center py-4">加载中...</div>
        ) : data ? (
          <div className="space-y-3">
            <div>
              <span className="text-xl font-bold text-blue-600">{data.word}</span>
              {data.phonetic && (
                <span className="ml-2 text-gray-500">{data.phonetic}</span>
              )}
            </div>

            {data.chinese && (
              <div>
                <div className="text-sm text-gray-500 mb-1">中文释义</div>
                <div className="text-lg">{data.chinese}</div>
              </div>
            )}

            {data.definition && (
              <div>
                <div className="text-sm text-gray-500 mb-1">英文释义</div>
                <div className="text-sm text-gray-700">{data.definition}</div>
              </div>
            )}

            {data.example && (
              <div>
                <div className="text-sm text-gray-500 mb-1">例句</div>
                <div className="text-sm italic text-gray-600">{data.example}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">未找到释义</div>
        )}
      </div>
    </div>
  )
}
