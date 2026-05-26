'use client'

import { useState, useRef } from 'react'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

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
      // Create FormData and send to server
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
  }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">从PDF导入单词</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="关闭"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 文件上传 */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            aria-label="选择PDF文件"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
          >
            {file ? file.name : '点击选择PDF文件（支持不背单词导出格式）'}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">解析中...</p>
          </div>
        )}

        {/* 解析结果 */}
        {extractedWords.length > 0 && !loading && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">
              提取的单词 ({extractedWords.length}个)
            </h3>
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
              {extractedWords.map(word => (
                <button
                  key={word}
                  onClick={() => toggleWord(word)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedWords.has(word)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 选中单词统计 */}
        {selectedWords.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              已选择 <strong>{selectedWords.size}</strong> 个单词
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={selectedWords.size === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            导入选中单词
          </button>
        </div>
      </div>
    </div>
  )
}
