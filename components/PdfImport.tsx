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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md">
      <div className="bg-[#080d19]/95 rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-800/60 max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]">

        {/* 弹窗顶栏 */}
        <div className="px-5 py-4 border-b border-slate-900/80 flex items-center justify-between bg-slate-950/40">
          <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            从 PDF 智能识别单词
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-900 transition-colors"
            aria-label="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 弹窗主体 */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-950/10">

          {/* 拖放上传区 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 bg-slate-950/30 ${
              isDragOver
                ? 'border-brand-500/50 bg-brand-500/5'
                : 'border-slate-800 hover:border-brand-500/40'
            } group`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              aria-label="选择PDF文件"
            />
            <div className="flex flex-col items-center gap-2.5 text-slate-500">
              <div className={`p-2.5 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl transition-transform duration-300 group-hover:scale-105 ${isDragOver ? 'scale-110 border-brand-500/50' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  {file ? file.name : '将不背单词 PDF 拖到此处，或点击上传'}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">支持物理坐标自动黏合与清洗</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <p className="text-rose-400 text-xs">{error}</p>
            </div>
          )}

          {/* 正在解析中 */}
          {loading && (
            <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2.5">
              <div className="w-5 h-5 rounded-full border border-slate-800 border-t-brand-500 animate-spin"></div>
              <p className="animate-pulse text-slate-400">正在深度拼合文本碎片并清洗词单...</p>
            </div>
          )}

          {/* 解析结果预览 */}
          {extractedWords.length > 0 && !loading && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                <span>识别到 {extractedWords.length} 个单词</span>
                <span className="text-brand-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  已去重清洗
                </span>
              </div>
              <div className="flex flex-wrap gap-1 p-2.5 bg-slate-950/50 rounded-xl border border-slate-900 max-h-36 overflow-y-auto">
                {extractedWords.map(word => (
                  <button
                    key={word}
                    onClick={() => toggleWord(word)}
                    className={`word-badge text-[11px] font-semibold px-2.5 py-1 rounded-md border shadow-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${
                      selectedWords.has(word)
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/30'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-brand-500/30 hover:text-brand-400'
                    }`}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 弹窗底栏 */}
        <div className="px-5 py-3.5 border-t border-slate-900/80 bg-slate-950/40 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={selectedWords.size === 0}
            className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold bg-brand-500 hover:bg-brand-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 rounded-xl transition-all"
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  )
}
