'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ArticleView from '@/components/ArticleView'
import { findDeformations, Deformation } from '@/lib/lemmatizer'
import { STYLE_LABELS } from '@/lib/constants'

interface ArticleData {
  id: number
  title: string
  content: string
  translation: string | null
  difficulty: string
  style: string
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
  const [copied, setCopied] = useState(false)
  const [maskMode, setMaskMode] = useState(false)

  const mainContent = useMemo(() => {
    if (!article?.content) return ''
    return article.content.split('【单词变形】')[0].trim()
  }, [article])

  const deformations = useMemo<Deformation[]>(() => {
    if (!mainContent || !article?.words?.length) return []

    const wordList = article.words.map(w => w.word)
    const definitions: Record<string, string> = {}

    article.words.forEach(w => {
      if (w.chinese) {
        definitions[w.word] = w.chinese
      } else if (w.definition) {
        definitions[w.word] = w.definition
      }
    })

    return findDeformations(wordList, mainContent, definitions)
  }, [mainContent, article])

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

  const handleCopy = async () => {
    if (!article) return

    let copyText = `📚 ${article.title}\n\n`
    copyText += `【英文原文】\n${mainContent}\n\n`

    if (article.translation) {
      copyText += `【中文翻译】\n${article.translation}\n\n`
    }

    if (deformations.length > 0) {
      copyText += `【单词变形】\n`
      deformations.forEach(d => {
        const typeStr = d.chinese ? `（${d.type}，${d.chinese}）` : `（${d.type}）`
        copyText += `${d.original} → ${d.deformed}${typeStr}\n`
      })
      copyText += '\n'
    }

    copyText += `\n— 来自 Word2Article 英语学习工具`

    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = copyText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

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
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>
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
            <button
              onClick={() => setMaskMode(!maskMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold border rounded-lg transition-all duration-200 ${
                maskMode
                  ? 'text-brand-500 bg-brand-500/10 border-brand-500/40 hover:bg-brand-500/20'
                  : 'text-slate-400 hover:text-brand-500 bg-slate-900/50 hover:bg-slate-900 border-slate-800 hover:border-brand-500/30'
              }`}
              title={maskMode ? '关闭遮罩' : '开启遮罩'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {maskMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
              {maskMode ? '遮罩中' : '遮罩'}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-brand-500 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/30 rounded-lg transition-all duration-200"
              title="复制全文"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-400">已复制</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>复制全文</span>
                </>
              )}
            </button>
            <span className="text-[10px] bg-slate-950 border border-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold">
              {article.difficulty.toUpperCase()}
            </span>
            <span className="text-[10px] bg-slate-950 border border-slate-900 text-slate-500 px-2 py-0.5 rounded font-bold">
              {STYLE_LABELS[article.style] || '阅读'}
            </span>
          </div>
        </div>

        {/* 文章展示内容 */}
        <div className="p-6 md:p-8 space-y-6">
          {/* 英文原文 */}
          <div className="text-slate-300 leading-relaxed font-serif text-[16.5px] md:text-[17.5px] tracking-wide space-y-4">
            <ArticleView content={mainContent} words={wordList} maskMode={maskMode} />
          </div>

          {/* 单词变形 */}
          {deformations.length > 0 && (
            <div className="border-t border-slate-900/80 pt-5">
              <h4 className="text-[10px] font-bold text-slate-500 tracking-wider mb-3 uppercase flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                单词变形对照
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {deformations.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-950/30 rounded-lg border border-slate-900/40">
                    <span className="text-xs text-slate-500 font-mono">{d.original}</span>
                    <svg className="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-xs text-brand-500 font-semibold font-mono">{d.deformed}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {d.type && (
                        <span className="text-[9px] bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded font-bold">
                          {d.type}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">({d.chinese || ''})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        <Link href={`/quiz/${params.id}`} className="text-[10px] text-emerald-500 hover:text-emerald-600 font-bold transition-colors">
          开始测试
        </Link>
        <Link href="/" className="text-[10px] text-brand-500 hover:text-brand-600 font-bold transition-colors">
          生成新文章
        </Link>
        <Link href="/history" className="text-[10px] text-slate-500 hover:text-slate-300 font-medium transition-colors">
          历史记录
        </Link>
      </div>
    </main>
  )
}
