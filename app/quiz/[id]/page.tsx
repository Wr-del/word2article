'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface QuizQuestion {
  id: number
  word: string
  phonetic: string | null
  chinese: string | null
  options: Array<{
    word: string
    chinese: string | null
    isCorrect: boolean
  }>
}

export default function QuizPage() {
  const params = useParams()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quiz?articleId=${params.id}`)
        const data = await response.json()
        setQuestions(data.questions || [])
      } catch (error) {
        console.error('Fetch quiz error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [params.id])

  const handleAnswer = (chinese: string) => {
    if (showResult) return
    setSelectedAnswer(chinese)
    setShowResult(true)

    const currentQuestion = questions[currentIndex]
    const isCorrect = currentQuestion.options.find(o => o.isCorrect)?.chinese === chinese

    if (isCorrect) {
      setScore(score + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setFinished(false)
  }

  if (loading) {
    return (
      <main className="max-w-2xl w-full mx-auto p-4 flex items-center justify-center">
        <div style={{ color: 'var(--fg-muted)' }} className="text-sm">加载中...</div>
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <main className="max-w-2xl w-full mx-auto p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div style={{ color: 'var(--fg-muted)' }}>暂无测试题目</div>
          <Link href="/" className="text-xs font-semibold" style={{ color: 'var(--brand-500)' }}>返回首页</Link>
        </div>
      </main>
    )
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <main className="max-w-2xl w-full mx-auto p-4 space-y-4 relative z-10">
        <div className="glass-card rounded-2xl custom-shadow p-8 text-center space-y-6">
          <div className="text-6xl font-bold" style={{ color: 'var(--brand-500)' }}>{percentage}%</div>
          <div className="space-y-2">
            <div className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>测试完成！</div>
            <div className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              共 {questions.length} 题，答对 {score} 题
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 font-bold text-xs rounded-xl transition-all"
              style={{ background: 'var(--brand-500)', color: '#ffffff' }}
            >
              再测一次
            </button>
            <Link
              href={`/article/${params.id}`}
              className="px-6 py-2.5 font-bold text-xs rounded-xl transition-all"
              style={{ background: 'var(--input-bg)', color: 'var(--fg-secondary)' }}
            >
              返回文章
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isCorrect = selectedAnswer
    ? currentQuestion.options.find(o => o.chinese === selectedAnswer)?.isCorrect
    : null

  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <main className="max-w-2xl w-full mx-auto p-4 space-y-4 relative z-10">
      {/* 进度栏 */}
      <div className="flex items-center justify-between">
        <Link href={`/article/${params.id}`} className="text-xs font-medium transition-colors" style={{ color: 'var(--fg-muted)' }}>
          退出
        </Link>
        <div className="text-xs font-semibold" style={{ color: 'var(--fg-muted)' }}>
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--input-bg)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--brand-500)' }}></div>
      </div>

      {/* 单词卡片 */}
      <div className="glass-card rounded-2xl custom-shadow p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold" style={{ color: 'var(--brand-500)' }}>{currentQuestion.word}</div>
          {currentQuestion.phonetic && (
            <div className="text-sm" style={{ color: 'var(--fg-muted)' }}>{currentQuestion.phonetic}</div>
          )}
          <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>选择正确的中文释义</div>
        </div>

        <div className="space-y-2.5">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option.chinese
            const isCorrectOption = option.isCorrect

            let bgColor = 'var(--input-bg)'
            let borderColor = 'var(--input-border)'
            let textColor = 'var(--fg-secondary)'
            let letterBg = 'var(--input-bg)'
            let letterColor = 'var(--fg-muted)'

            if (showResult) {
              if (isCorrectOption) {
                bgColor = 'var(--highlight-bg)'
                borderColor = 'var(--brand-500)'
                textColor = 'var(--brand-500)'
                letterBg = 'var(--brand-500)'
                letterColor = '#ffffff'
              } else if (isSelected && !isCorrectOption) {
                bgColor = 'rgba(239, 68, 68, 0.1)'
                borderColor = '#ef4444'
                textColor = '#ef4444'
                letterBg = '#ef4444'
                letterColor = '#ffffff'
              } else {
                textColor = 'var(--fg-muted)'
              }
            } else if (isSelected) {
              bgColor = 'var(--highlight-bg)'
              borderColor = 'var(--brand-500)'
              textColor = 'var(--brand-500)'
              letterBg = 'var(--brand-500)'
              letterColor = '#ffffff'
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(option.chinese || '')}
                disabled={showResult}
                className="w-full p-3.5 rounded-xl border text-left transition-all text-sm flex items-center gap-3"
                style={{ background: bgColor, borderColor, color: textColor }}
              >
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: letterBg, color: letterColor }}>
                  {String.fromCharCode(65 + index)}
                </span>
                {option.chinese}
              </button>
            )
          })}
        </div>

        {showResult && (
          <div className="text-center space-y-3 pt-2">
            <div className="text-sm font-semibold" style={{ color: isCorrect ? 'var(--brand-500)' : '#ef4444' }}>
              {isCorrect ? '回答正确！' : '回答错误'}
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 font-bold text-sm rounded-2xl transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
              }}
            >
              {currentIndex < questions.length - 1 ? '下一题' : '查看成绩'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
