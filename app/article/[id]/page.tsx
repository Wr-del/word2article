'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ArticleView from '@/components/ArticleView'

interface ArticleData {
  id: number
  title: string
  content: string
  translation: string | null
  difficulty: string
  words: Array<{
    word: string
    phonetic: string | null
    definition: string | null
    chinese: string | null
  }>
}

export default function ArticlePage() {
  const params = useParams()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${params.id}`)
        const data = await response.json()
        setArticle(data.article)
      } catch (error) {
        console.error('Fetch article error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [params.id])

  if (loading) {
    return (
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 flex items-center justify-center">
        <div className="text-slate-400 text-sm">加载中...</div>
      </main>
    )
  }

  if (!article) {
    return (
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 flex items-center justify-center">
        <div className="text-rose-400 text-sm">文章未找到</div>
      </main>
    )
  }

  const wordList = article.words.map(w => w.word)

  return (
    <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 space-y-6 relative z-10">
      <div className="mb-6">
        <a href="/" className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </a>
      </div>

      {/* 沉浸式文章阅读面板 */}
      <div className="glass-card rounded-2xl custom-shadow overflow-hidden flex flex-col">

        {/* 面板顶栏 */}
        <div className="px-5 py-4 border-b border-slate-900/60 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide">沉浸式阅读语境</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-950 border border-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold">
              {article.difficulty.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 文章展示内容 */}
        <div className="p-6 md:p-8 space-y-6">
          {/* 单词列表 */}
          <div className="mb-6 p-4 bg-slate-950/30 rounded-xl border border-slate-900/60">
            <div className="text-[10px] font-bold text-slate-500 mb-2.5 uppercase tracking-wider">本文章包含的单词</div>
            <div className="flex flex-wrap gap-1.5">
              {article.words.map((w, i) => (
                <span key={i} className="word-badge text-[11px] bg-slate-900 text-slate-300 font-semibold px-2.5 py-1 rounded-md border border-slate-800 shadow-sm">
                  {w.word}
                  {w.chinese && <span className="ml-1 text-slate-500">({w.chinese})</span>}
                </span>
              ))}
            </div>
          </div>

          {/* 英文原文 */}
          <div className="text-slate-300 leading-relaxed font-serif text-[16.5px] md:text-[17.5px] tracking-wide space-y-4">
            <ArticleView content={article.content} words={wordList} />
          </div>

          {/* 中文翻译 */}
          {article.translation && (
            <div className="border-t border-slate-900/80 pt-5">
              <h4 className="text-[10px] font-bold text-slate-500 tracking-wider mb-2.5 uppercase">参考中文译文</h4>
              <p className="text-slate-400 leading-relaxed text-xs whitespace-pre-wrap">
                {article.translation}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center space-x-4">
        <a href="/" className="text-[10px] text-brand-500 hover:text-brand-600 font-bold transition-colors">
          生成新文章
        </a>
        <a href="/history" className="text-[10px] text-slate-500 hover:text-slate-300 font-medium transition-colors">
          历史记录
        </a>
      </div>
    </main>
  )
}
