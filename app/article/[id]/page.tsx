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
        <div style={{ color: 'var(--fg-muted)' }} className="text-sm">加载中...</div>
      </main>
    )
  }

  if (!article) {
    return (
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 flex items-center justify-center">
        <div style={{ color: '#ef4444' }} className="text-sm">文章未找到</div>
      </main>
    )
  }

  const wordList = article.words.map(w => w.word)

  return (
    <main className="max-w-2xl w-full mx-auto p-4 space-y-4 relative z-10">
      {/* 沉浸式文章阅读面板 */}
      <div className="glass-card rounded-2xl custom-shadow overflow-hidden flex flex-col">

        {/* 面板顶栏 */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--input-bg)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--fg-muted)' }}>沉浸式阅读语境</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMaskMode(!maskMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200"
              style={{
                background: maskMode ? 'var(--highlight-bg)' : 'var(--input-bg)',
                color: maskMode ? 'var(--brand-500)' : 'var(--fg-muted)',
                border: `1px solid ${maskMode ? 'var(--brand-500)' : 'var(--border)'}`,
              }}
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200"
              style={{ background: 'var(--input-bg)', color: 'var(--fg-muted)', border: '1px solid var(--border)' }}
              title="复制全文"
            >
              {copied ? (
                <>
                   <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-purple-400">已复制</span>
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
            <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--fg-secondary)' }}>
              {article.difficulty.toUpperCase()}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--fg-muted)' }}>
              {STYLE_LABELS[article.style] || '阅读'}
            </span>
          </div>
        </div>

        {/* 文章展示内容 */}
        <div className="p-6 md:p-8 space-y-6">
          {/* 英文原文 */}
          <div className="leading-relaxed font-serif text-[16.5px] md:text-[17.5px] tracking-wide space-y-4" style={{ color: 'var(--fg)' }}>
            <ArticleView content={mainContent} words={wordList} maskMode={maskMode} />
          </div>

          {/* 单词变形 */}
          {deformations.length > 0 && (
            <div className="pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <h4 className="text-[10px] font-bold tracking-wider mb-3 uppercase flex items-center gap-2" style={{ color: 'var(--fg-muted)' }}>
                <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                单词变形对照
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {deformations.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                    <span className="text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>{d.original}</span>
                    <svg className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--fg-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-xs font-semibold font-mono" style={{ color: 'var(--brand-500)' }}>{d.deformed}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {d.type && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--highlight-bg)', color: 'var(--brand-500)' }}>
                          {d.type}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>({d.chinese || ''})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 中文翻译 */}
          {article.translation && (
            <div className="pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <h4 className="text-[10px] font-bold tracking-wider mb-2.5 uppercase" style={{ color: 'var(--fg-muted)' }}>参考中文译文</h4>
              <p className="leading-relaxed text-xs whitespace-pre-wrap" style={{ color: 'var(--fg-secondary)' }}>
                {article.translation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="flex gap-3">
        <Link
          href={`/quiz/${params.id}`}
          className="flex-1 py-3 text-center text-sm font-bold rounded-2xl transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
          }}
        >
          开始测验 →
        </Link>
        <Link
          href="/"
          className="px-5 py-3 text-sm font-semibold rounded-2xl transition-all"
          style={{ background: 'var(--input-bg)', color: 'var(--fg-secondary)', border: '1px solid var(--border)' }}
        >
          新文章
        </Link>
      </div>
    </main>
  )
}
