'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PdfImport from '@/components/PdfImport'
import { useToast } from '@/components/Toast'
import { STYLE_LABELS } from '@/lib/constants'

const STYLES = [
  { id: 'story', label: '故事' },
  { id: 'news', label: '新闻报道' },
  { id: 'science', label: '科普文章' },
  { id: 'dialogue', label: '对话' },
]

const DIFFICULTIES = [
  { id: 'cet4', label: 'CET-4' },
  { id: 'cet6', label: 'CET-6' },
  { id: 'ielts', label: 'IELTS' },
]

export default function Home() {
  const router = useRouter()
  const toast = useToast()
  const [text, setText] = useState('')
  const [style, setStyle] = useState('story')
  const [difficulty, setDifficulty] = useState('cet4')
  const [loading, setLoading] = useState(false)
  const [showPdfImport, setShowPdfImport] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    if (!text.trim()) {
      setWordCount(0)
      return
    }
    const words = text.split(/[,，\s\n]+/).filter(w => w.trim().length > 0)
    setWordCount(words.length)
  }, [text])

  const handleSubmit = async () => {
    if (!text.trim()) return

    setLoading(true)
    try {
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!extractRes.ok) {
        toast('提取单词失败，请重试')
        return
      }

      const extractData = await extractRes.json()
      if (!extractData.words || extractData.words.length === 0) {
        toast('未能识别出有效单词，请检查输入格式')
        return
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: extractData.words, difficulty, style }),
      })

      if (!response.ok) {
        toast('生成文章失败，请重试')
        return
      }
      const data = await response.json()
      if (data.article) {
        router.push(`/article/${data.article.id}`)
      } else {
        toast('生成文章失败，请重试')
      }
    } catch (error) {
      console.error('Generate error:', error)
      toast('生成文章失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePdfImport = (words: string[]) => {
    setShowPdfImport(false)
    setText(words.join(', '))
  }

  return (
    <main className="max-w-2xl w-full mx-auto p-4 space-y-4 relative z-10">
      {/* 页面标题 */}
      <div className="space-y-1 pt-2 pb-1">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>工作台</h1>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
          将词汇列表转化为语境文章，通过阅读增强记忆
        </p>
      </div>

      {/* 词汇输入卡片 */}
      <div className="glass-card rounded-2xl custom-shadow p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--brand-500)' }}>
            词汇输入
          </span>
          <button
            onClick={() => setShowPdfImport(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors"
            style={{ color: 'var(--brand-500)', background: 'var(--highlight-bg)' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            导入 PDF
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴单词列表，用逗号或换行分隔。如：abandon, ability, achieve, belief..."
          className="w-full h-28 p-3 text-sm leading-relaxed rounded-xl resize-none focus:outline-none transition-all"
          style={{
            background: 'var(--input-bg)',
            color: 'var(--fg)',
            border: '1px solid var(--input-border)',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-500)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>
            已检测 <span style={{ color: wordCount > 0 ? 'var(--brand-500)' : 'var(--fg-muted)', fontWeight: wordCount > 0 ? 600 : 400 }}>{wordCount}</span> 个单词
          </span>
          {text && (
            <button
              onClick={() => setText('')}
              className="text-[10px] font-medium transition-colors"
              style={{ color: 'var(--fg-muted)' }}
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* 文章风格卡片 */}
      <div className="glass-card rounded-2xl custom-shadow p-4 space-y-3">
        <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--brand-500)' }}>
          文章风格
        </span>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left"
              style={{
                background: style === s.id ? 'var(--highlight-bg)' : 'var(--input-bg)',
                border: `1px solid ${style === s.id ? 'var(--brand-500)' : 'var(--input-border)'}`,
                color: style === s.id ? 'var(--brand-500)' : 'var(--fg-secondary)',
              }}
            >
              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: style === s.id ? 'var(--brand-500)' : 'var(--border-strong)' }}>
                {style === s.id && (
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-500)' }}></span>
                )}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 目标难度卡片 */}
      <div className="glass-card rounded-2xl custom-shadow p-4 space-y-3">
        <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--brand-500)' }}>
          目标难度
        </span>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className="flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: difficulty === d.id ? 'var(--brand-500)' : 'var(--input-bg)',
                color: difficulty === d.id ? '#ffffff' : 'var(--fg-secondary)',
                border: `1px solid ${difficulty === d.id ? 'var(--brand-500)' : 'var(--input-border)'}`,
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || loading}
        className="w-full py-3.5 font-bold text-sm rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
          color: '#ffffff',
          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
        }}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            生成中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            生成文章
          </>
        )}
      </button>

      {showPdfImport && (
        <PdfImport
          onImport={handlePdfImport}
          onClose={() => setShowPdfImport(false)}
        />
      )}
    </main>
  )
}
