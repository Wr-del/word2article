'use client'

import { useState, useRef, useCallback } from 'react'

interface PdfImportProps {
  onImport: (words: string[]) => void
  onClose: () => void
}

export default function PdfImport({ onImport, onClose }: PdfImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [extractedWords, setExtractedWords] = useState<string[]>([])
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('请选择PDF文件')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过10MB')
      return
    }

    setFile(selectedFile)
    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '解析失败')
      }

      const data = await response.json()
      setExtractedWords(data.words)
      setSelectedWords(new Set(data.words))
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析PDF失败，请检查文件格式')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }, [processFile])

  const toggleWord = (word: string) => {
    const newSelected = new Set(selectedWords)
    if (newSelected.has(word)) {
      newSelected.delete(word)
    } else {
      newSelected.add(word)
    }
    setSelectedWords(newSelected)
  }

  const handleImport = () => {
    const words = Array.from(selectedWords)
    if (words.length === 0) {
      setError('请至少选择一个单词')
      return
    }
    onImport(words)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-t-2xl sm:rounded-2xl border-t sm:border max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>

        {/* 弹窗顶栏 */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }}>
          <h3 className="font-bold text-xs flex items-center gap-2" style={{ color: 'var(--fg)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--brand-500)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            从 PDF 智能识别单词
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl transition-colors"
            style={{ color: 'var(--fg-muted)' }}
            aria-label="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 弹窗主体 */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* 拖放上传区 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150"
            style={{
              borderColor: isDragOver ? 'var(--brand-500)' : 'var(--border)',
              background: isDragOver ? 'var(--highlight-bg)' : 'var(--input-bg)',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              aria-label="选择PDF文件"
            />
            <div className="flex flex-col items-center gap-2.5">
              <div className="p-2.5 rounded-xl transition-transform duration-300" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--fg-muted)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>
                  {file ? file.name : '将不背单词 PDF 拖到此处，或点击上传'}
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--fg-muted)' }}>支持物理坐标自动黏合与清洗</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          {/* 正在解析中 */}
          {loading && (
            <div className="py-8 text-center text-xs flex flex-col items-center gap-2.5" style={{ color: 'var(--fg-muted)' }}>
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--brand-500)' }}></div>
              <p className="animate-pulse">正在深度拼合文本碎片并清洗词单...</p>
            </div>
          )}

          {/* 解析结果预览 */}
          {extractedWords.length > 0 && !loading && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold flex items-center justify-between" style={{ color: 'var(--fg-muted)' }}>
                <span>识别到 {extractedWords.length} 个单词</span>
                <span className="flex items-center gap-1" style={{ color: 'var(--brand-500)' }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  已去重清洗
                </span>
              </div>
              <div className="flex flex-wrap gap-1 p-2.5 rounded-xl max-h-36 overflow-y-auto" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                {extractedWords.map(word => (
                  <button
                    key={word}
                    onClick={() => toggleWord(word)}
                    className="word-badge text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all duration-200"
                    style={{
                      background: selectedWords.has(word) ? 'var(--highlight-bg)' : 'var(--bg-secondary)',
                      borderColor: selectedWords.has(word) ? 'var(--brand-500)' : 'var(--border)',
                      color: selectedWords.has(word) ? 'var(--brand-500)' : 'var(--fg-secondary)',
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 弹窗底栏 */}
        <div className="px-5 py-3.5 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }}>
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors"
            style={{ color: 'var(--fg-muted)' }}
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={selectedWords.size === 0}
            className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
            style={{ background: 'var(--brand-500)', color: '#ffffff' }}
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  )
}
