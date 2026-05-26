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
    // 使用默认难度，直接生成文章
    await handleSubmit(words, 'cet4')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-center mb-2">Word2Article</h1>
        <p className="text-gray-500 text-center mb-8">
          将单词变成文章，通过语境记忆单词
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <WordInput onSubmit={handleSubmit} loading={loading} />

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowPdfImport(true)}
              className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              从PDF导入单词
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/history"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            查看历史记录
          </a>
        </div>
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
