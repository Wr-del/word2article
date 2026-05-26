'use client'

import { useState } from 'react'

interface WordInputProps {
  onSubmit: (words: string[], difficulty: string) => void
  loading: boolean
}

export default function WordInput({ onSubmit, loading }: WordInputProps) {
  const [text, setText] = useState('')
  const [difficulty, setDifficulty] = useState('cet4')

  const handleSubmit = async () => {
    if (!text.trim()) return

    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    const data = await response.json()
    if (data.words && data.words.length > 0) {
      onSubmit(data.words, difficulty)
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴你的单词列表，支持任意格式：&#10;1. abandon 放弃&#10;2. ability 能力&#10;achieve, belief, confidence..."
        className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        disabled={loading}
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setDifficulty('cet4')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              difficulty === 'cet4'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            CET-4
          </button>
          <button
            onClick={() => setDifficulty('cet6')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              difficulty === 'cet6'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            CET-6
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '生成中...' : '生成文章'}
        </button>
      </div>
    </div>
  )
}
