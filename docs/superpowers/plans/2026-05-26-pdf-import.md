# PDF导入功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为Word2Article应用添加PDF导入功能，支持从"不背单词"app导出的PDF中提取单词

**Architecture:** 使用客户端PDF解析（pdfjs-dist），在浏览器端直接解析PDF文件，确保用户隐私。提供自动解析和手动选择两种模式。

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, pdfjs-dist

---

## 文件结构

### 新建文件
- `components/PdfImport.tsx` - PDF导入主组件
- `lib/pdf-parser.ts` - PDF解析工具函数
- `app/api/extract/route.ts` - 修改现有API支持PDF文本提取

### 修改文件
- `app/page.tsx` - 集成PDF导入按钮
- `package.json` - 添加pdfjs-dist依赖

---

## Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装pdfjs-dist**

```bash
npm install pdfjs-dist
```

- [ ] **Step 2: 验证安装**

```bash
npm list pdfjs-dist
```

Expected: 显示pdfjs-dist版本信息

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json
git commit -m "deps: 添加pdfjs-dist依赖"
```

---

## Task 2: 创建PDF解析工具

**Files:**
- Create: `lib/pdf-parser.ts`

- [ ] **Step 1: 创建PDF解析工具函数**

```typescript
import * as pdfjsLib from 'pdfjs-dist'

// 设置worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + '\n'
  }

  return fullText
}

export function extractWordsFromText(text: string): string[] {
  // 匹配英文单词（2个字母以上）
  const wordRegex = /\b[a-zA-Z]{2,}\b/g
  const words = text.match(wordRegex) || []

  // 去重并转换为小写
  const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))]

  // 过滤常见噪音词
  const noiseWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now',
    'page', 'pdf', 'word', 'list', 'test', 'exam', 'unit', 'chapter'
  ])

  return uniqueWords.filter(word => !noiseWords.has(word))
}
```

- [ ] **Step 2: 验证代码编译**

```bash
npx tsc --noEmit lib/pdf-parser.ts
```

Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add lib/pdf-parser.ts
git commit -m "feat: 添加PDF解析工具函数"
```

---

## Task 3: 创建PdfImport组件

**Files:**
- Create: `components/PdfImport.tsx`

- [ ] **Step 1: 创建PdfImport组件**

```typescript
'use client'

import { useState, useRef } from 'react'
import { extractTextFromPdf, extractWordsFromText } from '@/lib/pdf-parser'

interface PdfImportProps {
  onImport: (words: string[]) => void
  onClose: () => void
}

export default function PdfImport({ onImport, onClose }: PdfImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [extractedWords, setExtractedWords] = useState<string[]>([])
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [pdfText, setPdfText] = useState('')
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
      const text = await extractTextFromPdf(selectedFile)
      setPdfText(text)

      if (mode === 'auto') {
        const words = extractWordsFromText(text)
        setExtractedWords(words)
        setSelectedWords(new Set(words))
      }
    } catch (err) {
      setError('解析PDF失败，请检查文件格式')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleModeChange = async (newMode: 'auto' | 'manual') => {
    setMode(newMode)

    if (file && pdfText) {
      if (newMode === 'auto') {
        const words = extractWordsFromText(pdfText)
        setExtractedWords(words)
        setSelectedWords(new Set(words))
      } else {
        setExtractedWords([])
        setSelectedWords(new Set())
      }
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
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
          >
            {file ? file.name : '点击选择PDF文件'}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* 模式选择 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleModeChange('auto')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'auto'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            自动解析
          </button>
          <button
            onClick={() => handleModeChange('manual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            手动选择
          </button>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">解析中...</p>
          </div>
        )}

        {/* 自动解析结果 */}
        {mode === 'auto' && extractedWords.length > 0 && !loading && (
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

        {/* 手动选择模式 */}
        {mode === 'manual' && pdfText && !loading && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">PDF内容（点击选择单词）</h3>
            <div className="p-4 border rounded-lg max-h-60 overflow-y-auto bg-gray-50">
              {pdfText.split(/\s+/).map((word, index) => {
                const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
                if (cleanWord.length < 2) return <span key={index}>{word} </span>

                return (
                  <button
                    key={index}
                    onClick={() => toggleWord(cleanWord)}
                    className={`inline-block m-0.5 px-1 rounded ${
                      selectedWords.has(cleanWord)
                        ? 'bg-blue-200 text-blue-800'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    {word}
                  </button>
                )
              })}
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
```

- [ ] **Step 2: 验证代码编译**

```bash
npx tsc --noEmit components/PdfImport.tsx
```

Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add components/PdfImport.tsx
git commit -m "feat: 添加PdfImport组件"
```

---

## Task 4: 修改首页集成PDF导入

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 添加PDF导入按钮和状态**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WordInput from '@/components/WordInput'
import PdfImport from '@/components/PdfImport'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPdfImport, setShowPdfImport] = useState(false)

  const handleSubmit = async (words: string[], difficulty: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, difficulty }),
      })

      const data = await response.json()
      if (data.article) {
        router.push(`/article/${data.article.id}`)
      }
    } catch (error) {
      console.error('Generate error:', error)
      alert('生成文章失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePdfImport = async (words: string[]) => {
    setShowPdfImport(false)
    // 使用默认难度，直接生成文章
    await handleSubmit(words, 'cet4')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-center mb-2">Word2Article</h1>
        <p className="text-gray-500 text-center mb-8">
          将单词变成文章，通过语境记忆单词
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <WordInput onSubmit={handleSubmit} loading={loading} />

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowPdfImport(true)}
              className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              从PDF导入单词
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/history"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            查看历史记录
          </a>
        </div>
      </div>

      {/* PDF导入弹窗 */}
      {showPdfImport && (
        <PdfImport
          onImport={handlePdfImport}
          onClose={() => setShowPdfImport(false)}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 2: 验证代码编译**

```bash
npx tsc --noEmit app/page.tsx
```

Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add app/page.tsx
git commit -m "feat: 在首页集成PDF导入功能"
```

---

## Task 5: 测试完整功能

**Files:**
- Test: 手动测试

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 测试PDF导入功能**

1. 打开浏览器访问 http://localhost:3000
2. 点击"从PDF导入单词"按钮
3. 选择一个PDF文件
4. 测试自动解析模式
5. 测试手动选择模式
6. 点击"导入选中单词"
7. 验证单词是否正确导入并生成文章

- [ ] **Step 3: 提交最终版本**

```bash
git add .
git commit -m "feat: 完成PDF导入功能"
```

---

## 验收标准

- [ ] 能够上传PDF文件（最大10MB）
- [ ] 自动解析模式能正确提取英文单词
- [ ] 手动选择模式能正常工作
- [ ] 导入的单词能进入学习流程
- [ ] 界面响应式，支持移动端
- [ ] 错误处理完善（文件格式错误、大小超限等）
