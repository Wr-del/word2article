'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WordInput from '@/components/WordInput'
import PdfImport from '@/components/PdfImport'
import { useToast } from '@/components/Toast'

export default function Home() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [showPdfImport, setShowPdfImport] = useState(false)
  const [importedText, setImportedText] = useState('')

  const handleSubmit = async (words: string[], difficulty: string, style: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, difficulty, style }),
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
    setImportedText(words.join(', '))
  }

  return (
    <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 space-y-6 relative z-10">
      <div className="text-center space-y-1.5 py-4">
        <h2 className="text-xl font-bold tracking-wider" style={{ color: 'var(--fg)' }}>记忆工作台</h2>
        <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>将零碎的单词变成文章，通过语境记忆单词</p>
      </div>

      <div className="glass-card rounded-2xl custom-shadow p-5 md:p-6 space-y-5 transition-all duration-300">
        <WordInput
          onSubmit={handleSubmit}
          loading={loading}
          initialText={importedText}
        />

        <div style={{ borderTop: '1px solid var(--border)' }}></div>

        <button
          onClick={() => setShowPdfImport(true)}
          className="w-full py-3 font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5"
          style={{ border: '1px solid var(--border)', color: 'var(--fg-secondary)', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--fg)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-secondary)' }}
        >
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--brand-500)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          从 PDF 词单导入单词
        </button>
      </div>

      {showPdfImport && (
        <PdfImport
          onImport={handlePdfImport}
          onClose={() => setShowPdfImport(false)}
        />
      )}
    </main>
  )
}
