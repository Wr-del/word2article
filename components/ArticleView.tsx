'use client'

import { useState, useCallback } from 'react'
import WordPopup from './WordPopup'
import { getLemmas, getDeformationType } from '@/lib/lemmatizer'

interface ArticleViewProps {
  content: string
  words: string[]
  maskMode?: boolean
}

export default function ArticleView({ content, words, maskMode = false }: ArticleViewProps) {
  const [popup, setPopup] = useState<{
    word: string
    position: { x: number; y: number }
    lookupWord?: string
    originalWord?: string
    deformedWord?: string
    deformationType?: string
  } | null>(null)
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set())

  const handleWordClick = useCallback((word: string, event: React.MouseEvent, extra?: { lookupWord?: string; originalWord?: string; deformedWord?: string; deformationType?: string }) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setPopup({
      word,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom,
      },
      ...extra,
    })
  }, [])

  const handleMaskClick = useCallback((word: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setRevealedWords(prev => {
      const next = new Set(prev)
      next.add(word.toLowerCase())
      return next
    })
    setTimeout(() => {
      setRevealedWords(prev => {
        const next = new Set(prev)
        next.delete(word.toLowerCase())
        return next
      })
    }, 1500)
  }, [])

  const renderContent = () => {
    if (!content) return null

    const wordSet = new Set(words.map(w => w.toLowerCase()))
    
    // 匹配所有英文单词
    const regex = /\b[a-zA-Z]+(?:[''-][a-zA-Z]+)*\b/g

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      const matchedWord = match[0]
      const lowerWord = matchedWord.toLowerCase()
      
      // 检查是否是目标单词（原形）
      const isTargetWord = wordSet.has(lowerWord)
      
      // 检查是否是目标单词的变形
      let isDeformation = false
      let originalWord = ''
      
      if (!isTargetWord) {
        // 获取这个单词可能的原形
        const lemmas = getLemmas(matchedWord)
        for (const lemma of lemmas) {
          if (wordSet.has(lemma.toLowerCase())) {
            isDeformation = true
            originalWord = lemma
            break
          }
        }
      }

      if (isTargetWord) {
        if (maskMode && !revealedWords.has(lowerWord)) {
          // 遮罩模式：显示首字母 + 下划线
          parts.push(
            <span
              key={match.index}
              onClick={(e) => handleMaskClick(matchedWord, e)}
              className="mask-word cursor-pointer select-none word-badge"
              title="点击揭示"
            >
              <span className="mask-word-reveal">{matchedWord[0]}</span>
              <span className="mask-word-hidden">{matchedWord.slice(1)}</span>
            </span>
          )
        } else {
          // 原形高亮（非遮罩模式，或已揭示）
          parts.push(
            <span
              key={match.index}
              onClick={(e) => handleWordClick(matchedWord, e)}
              className="premium-highlight cursor-help transition-all duration-150 select-none word-badge"
            >
              {matchedWord}
            </span>
          )
        }
      } else if (isDeformation) {
        // 变形高亮（不同样式）
        parts.push(
          <span
            key={match.index}
            onClick={(e) => handleWordClick(matchedWord, e, {
              lookupWord: originalWord,
              originalWord,
              deformedWord: matchedWord,
              deformationType: getDeformationType(originalWord, matchedWord),
            })}
            className="deformation-highlight cursor-help transition-all duration-150 select-none word-badge"
            title={`变形: ${originalWord}`}
          >
            {matchedWord}
          </span>
        )
      } else {
        parts.push(
          <span
            key={match.index}
            onClick={(e) => handleWordClick(matchedWord, e)}
            className="cursor-help transition-colors duration-150 hover:text-brand-400"
          >
            {matchedWord}
          </span>
        )
      }

      lastIndex = match.index + matchedWord.length
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    return parts
  }

  return (
    <div className="relative">
      <div className="text-slate-300 leading-relaxed font-serif text-[16.5px] md:text-[17.5px] tracking-wide space-y-4">
        {renderContent()}
      </div>

      {popup && (
        <WordPopup
          word={popup.word}
          position={popup.position}
          lookupWord={popup.lookupWord}
          originalWord={popup.originalWord}
          deformedWord={popup.deformedWord}
          deformationType={popup.deformationType}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
