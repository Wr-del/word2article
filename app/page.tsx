'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WordInput from '@/components/WordInput'
import PdfImport from '@/components/PdfImport'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPdfImport, setShowPdfImport] = useState(false)

  const handleSubmit = async (words: string[], difficulty: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, difficulty }),
      })

      const data = await response.json()
      if (data.article) {
        router.push(`/article/${data.article.id}`)
      }
    } catch (error) {
      console.error('Generate error:', error)
      alert('生成文章失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePdfImport = async (words: string[]) => {
    setShowPdfImport(false)
    await handleSubmit(words, 'cet4')
  }

  return (
    <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 space-y-6 relative z-10">
      {/* 极简标题 */}
      <div className="text-center space-y-1.5 py-4">
        <h2 className="text-xl font-bold text-slate-200 tracking-wider">记忆工作台</h2>
        <p className="text-xs text-slate-500">将零碎的单词变成文章，通过语境记忆单词</p>
      </div>

      {/* 核心中央卡片 */}
      <div className="glass-card rounded-2xl custom-shadow p-5 md:p-6 space-y-5 hover:border-slate-800/60 transition-all duration-300">
        <WordInput onSubmit={handleSubmit} loading={loading} />

        {/* 分割线 */}
        <div className="border-t border-slate-900/60"></div>

        {/* PDF 导入入口 */}
        <button
          onClick={() => setShowPdfImport(true)}
          className="w-full py-3 border border-slate-800/80 hover:border-slate-700 hover:text-slate-200 bg-slate-900/10 text-slate-400 font-semibold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 hover:bg-slate-900/30"
        >
          <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          从 PDF 词单导入单词
        </button>
      </div>

      {/* PDF导入弹窗 */}
      {showPdfImport && (
        <PdfImport
          onImport={handlePdfImport}
          onClose={() => setShowPdfImport(false)}
        />
      )}
    </main>
  )
}
