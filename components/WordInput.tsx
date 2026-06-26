'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

interface WordInputProps {
  onSubmit: (words: string[], difficulty: string, style: string) => void
  loading: boolean
  initialText?: string
}

const STYLES = [
  { id: 'story', label: '故事' },
  { id: 'news', label: '新闻' },
  { id: 'science', label: '科普' },
  { id: 'dialogue', label: '对话' },
]

export default function WordInput({ onSubmit, loading, initialText = '' }: WordInputProps) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [difficulty, setDifficulty] = useState('cet4')
  const [style, setStyle] = useState('story')

  useEffect(() => {
    if (initialText && !text) {
      setText(initialText)
    }
  }, [initialText])

  const handleSubmit = async () => {
    if (!text.trim()) return

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('提取单词失败')
      }

      const data = await response.json()
      if (data.words && data.words.length > 0) {
        onSubmit(data.words, difficulty, style)
      } else {
        toast('未能识别出有效单词，请检查输入格式')
      }
    } catch (error) {
      console.error('Extract error:', error)
      toast('提取单词失败，请重试')
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="贴入单词列表，支持任意格式：&#10;abandon, ability, achieve, belief..."
          className="w-full h-32 p-4 text-sm leading-relaxed rounded-xl resize-none focus:outline-none focus:ring-2 transition-all"
          style={{
            background: 'var(--input-bg)',
            color: 'var(--fg)',
            border: '1px solid var(--input-border)',
          }}
          onFocus={e => { e.currentTarget.style.background = 'var(--input-focus-bg)'; e.currentTarget.style.borderColor = 'var(--brand-500)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'; }}
          onBlur={e => { e.currentTarget.style.background = 'var(--input-bg)'; e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          disabled={loading}
        />
        {text && (
          <button
            onClick={() => setText('')}
            className="absolute right-3 top-3 p-1 rounded-md transition-colors"
            style={{ color: 'var(--fg-muted)' }}
            title="清空"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 风格选择 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] mr-1" style={{ color: 'var(--fg-muted)' }}>风格</span>
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all"
            style={{
              background: style === s.id ? 'var(--highlight-bg)' : 'transparent',
              color: style === s.id ? 'var(--brand-500)' : 'var(--fg-muted)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 难度 + 生成按钮 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
          {['cet4', 'cet6'].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className="px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all"
              style={{
                background: difficulty === d ? 'var(--bg-secondary)' : 'transparent',
                color: difficulty === d ? 'var(--fg)' : 'var(--fg-muted)',
                boxShadow: difficulty === d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {d === 'cet4' ? 'CET-4' : 'CET-6'}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--brand-500)' }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--brand-600)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--brand-500)'; }}
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></div>
              生成中...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              一键生成
            </>
          )}
        </button>
      </div>
    </div>
  )
}
