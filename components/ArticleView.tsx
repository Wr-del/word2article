'use client'

import { useState, useCallback } from 'react'
import WordPopup from './WordPopup'

interface ArticleViewProps {
  content: string
  words: string[]
}

export default function ArticleView({ content, words }: ArticleViewProps) {
  const [popup, setPopup] = useState<{
    word: string
    position: { x: number; y: number }
  } | null>(null)

  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setPopup({
      word,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom,
      },
    })
  }, [])

  const renderContent = () => {
    if (!content) return null

    const wordSet = new Set(words.map(w => w.toLowerCase()))
    const wordPattern = words
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const regex = new RegExp(`\\b(${wordPattern})\\b`, 'gi')

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      const matchedWord = match[0]
      const isTargetWord = wordSet.has(matchedWord.toLowerCase())

      if (isTargetWord) {
        parts.push(
          <span
            key={match.index}
            onClick={(e) => handleWordClick(matchedWord, e)}
            className="premium-highlight cursor-help transition-all duration-150 select-none word-badge"
          >
            {matchedWord}
          </span>
        )
      } else {
        parts.push(matchedWord)
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
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
