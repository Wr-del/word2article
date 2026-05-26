'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WordInput from '@/components/WordInput'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-center mb-2">Word2Article</h1>
        <p className="text-gray-500 text-center mb-8">
          将单词变成文章，通过语境记忆单词
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <WordInput onSubmit={handleSubmit} loading={loading} />
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
    </main>
  )
}
