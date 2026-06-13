'use client'

import { useState, useEffect } from 'react'

interface WordInputProps {
  onSubmit: (words: string[], difficulty: string, style: string) => void
  loading: boolean
  initialText?: string
}

const STYLES = [
  { id: 'story', label: '故事', icon: '📖' },
  { id: 'news', label: '新闻', icon: '📰' },
  { id: 'science', label: '科普', icon: '🔬' },
  { id: 'dialogue', label: '对话', icon: '💬' },
]

export default function WordInput({ onSubmit, loading, initialText = '' }: WordInputProps) {
  const [text, setText] = useState('')
  const [difficulty, setDifficulty] = useState('cet4')
  const [style, setStyle] = useState('story')

  // 当initialText变化时，更新文本框内容
  useEffect(() => {
    if (initialText) {
      setText(initialText)
    }
  }, [initialText])

  const handleSubmit = async () => {
    if (!text.trim()) return

    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    const data = await response.json()
    if (data.words && data.words.length > 0) {
      onSubmit(data.words, difficulty, style)
    }
  }

  return (
    <div className="space-y-4">
      {/* 文本输入区 */}
      <div className="relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="贴入您的单词列表，支持任意格式：&#10;1. abandon 放弃 2. ability 能力 achieve, belief, confidence..."
          className="w-full h-36 p-4 text-slate-200 bg-[#070d19]/40 border border-slate-900/80 rounded-xl focus:outline-none focus:border-brand-500/30 focus:bg-[#070d19]/80 focus:ring-1 focus:ring-brand-500/10 transition-all duration-300 text-sm leading-relaxed placeholder-slate-700 shadow-inner resize-none"
          disabled={loading}
        />
        {/* 清除按钮 */}
        {text && (
          <button
            onClick={() => setText('')}
            className="absolute right-3.5 top-3.5 p-1.5 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-all duration-200"
            title="清空"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* 文章风格 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-600 mr-1">风格</span>
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 ${
              style === s.id
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 词汇分类与生成按钮 */}
      <div className="flex items-center justify-between gap-3">
        {/* 分类药丸按钮 */}
        <div className="flex items-center gap-1 bg-[#070d19]/80 p-1 rounded-xl border border-slate-900">
          <button
            onClick={() => setDifficulty('cet4')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 ${
              difficulty === 'cet4'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            CET-4
          </button>
          <button
            onClick={() => setDifficulty('cet6')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 ${
              difficulty === 'cet6'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            CET-6
          </button>
        </div>

        {/* 极简生成按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="bg-gradient-to-r from-brand-500 to-emerald-400 hover:from-brand-600 hover:to-emerald-500 active:scale-[0.97] text-slate-950 font-bold text-xs px-5.5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-lg hover:shadow-brand-500/25 border border-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border border-slate-950 border-t-transparent animate-spin"></div>
              正在生成中...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              一键生成文章
            </>
          )}
        </button>
      </div>
    </div>
  )
}
