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
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 flex items-center justify-center">
        <div className="text-slate-400 text-sm">加载中...</div>
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-slate-400">暂无测试题目</div>
           <Link href="/" className="text-xs text-brand-500 hover:text-brand-600">返回首页</Link>
        </div>
      </main>
    )
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 space-y-6 relative z-10">
        <div className="glass-card rounded-2xl custom-shadow p-8 text-center space-y-6">
          <div className="text-6xl font-bold text-brand-500">{percentage}%</div>
          <div className="space-y-2">
            <div className="text-slate-200 text-lg font-semibold">测试完成！</div>
            <div className="text-slate-400 text-sm">
              共 {questions.length} 题，答对 {score} 题
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
            >
              再测一次
            </button>
            <Link
              href={`/article/${params.id}`}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
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

  return (
    <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:py-8 space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <Link href={`/article/${params.id}`} className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回文章
        </Link>
        <div className="text-xs text-slate-500">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="glass-card rounded-2xl custom-shadow p-6 md:p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="text-3xl font-bold text-brand-500">{currentQuestion.word}</div>
          {currentQuestion.phonetic && (
            <div className="text-slate-500 text-sm">{currentQuestion.phonetic}</div>
          )}
          <div className="text-slate-400 text-sm">选择正确的中文释义</div>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option.chinese
            const isCorrectOption = option.isCorrect
            
            let buttonClass = 'w-full p-4 rounded-xl border text-left transition-all text-sm '
            
            if (showResult) {
              if (isCorrectOption) {
                buttonClass += 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
              } else if (isSelected && !isCorrectOption) {
                buttonClass += 'border-rose-500 bg-rose-500/10 text-rose-400'
              } else {
                buttonClass += 'border-slate-800 text-slate-500'
              }
            } else {
              buttonClass += isSelected
                ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                : 'border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-200'
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(option.chinese || '')}
                disabled={showResult}
                className={buttonClass}
              >
                <span className="font-mono text-slate-600 mr-3">{String.fromCharCode(65 + index)}.</span>
                {option.chinese}
              </button>
            )
          })}
        </div>

        {showResult && (
          <div className="text-center space-y-4">
            <div className={`text-sm font-semibold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isCorrect ? '回答正确！' : '回答错误'}
            </div>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
            >
              {currentIndex < questions.length - 1 ? '下一题' : '查看成绩'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
