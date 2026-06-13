'use client'

import { useState, useCallback } from 'react'
import WordPopup from './WordPopup'
import { getLemmas } from '@/lib/lemmatizer'

interface ArticleViewProps {
  content: string
  words: string[]
}

function guessDeformationType(deformed: string): string {
  const w = deformed.toLowerCase()
  if (/[^aeiou]ied$/.test(w) || /ed$/.test(w)) return '过去式/过去分词'
  if (/ing$/.test(w)) return '进行时'
  if (/([^aeiouy][aeiouy])([^aeiouy])er$/.test(w) || /([^e])er$/.test(w) || /er$/.test(w)) return '比较级'
  if (/([^aeiouy][aeiouy])([^aeiouy])est$/.test(w) || /([^e])est$/.test(w) || /est$/.test(w)) return '最高级'
  if (/([^l])ly$/.test(w) || /ally$/.test(w) || /ly$/.test(w)) return '副词'
  if (/([^aeiou])ies$/.test(w) || /(?:sh|ch|ss|x|z|o)es$/.test(w) || /ves$/.test(w) || /s$/.test(w)) return '复数/第三人称单数'
  if (/tion$/.test(w) || /sion$/.test(w) || /ment$/.test(w) || /ness$/.test(w) || /ity$/.test(w)) return '名词形式'
  if (/ful$/.test(w) || /less$/.test(w) || /ous$/.test(w) || /ive$/.test(w) || /able$/.test(w) || /ible$/.test(w)) return '形容词形式'
  return '变形'
}

export default function ArticleView({ content, words }: ArticleViewProps) {
  const [popup, setPopup] = useState<{
    word: string
    position: { x: number; y: number }
    lookupWord?: string
    originalWord?: string
    deformedWord?: string
    deformationType?: string
  } | null>(null)

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
        // 原形高亮
        parts.push(
          <span
            key={match.index}
            onClick={(e) => handleWordClick(matchedWord, e)}
            className="premium-highlight cursor-help transition-all duration-150 select-none word-badge"
          >
            {matchedWord}
          </span>
        )
      } else if (isDeformation) {
        // 变形高亮（不同样式）
        parts.push(
          <span
            key={match.index}
            onClick={(e) => handleWordClick(matchedWord, e, {
              lookupWord: originalWord,
              originalWord,
              deformedWord: matchedWord,
              deformationType: guessDeformationType(matchedWord),
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
