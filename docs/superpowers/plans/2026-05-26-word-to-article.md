# Word2Article 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Next.js 全栈英语学习工具，将单词列表自动生成优质英语文章，支持生词高亮标记和点击翻译。

**Architecture:** Next.js 14 App Router 前后端一体，API Routes 调用 DeepSeek 生成文章 + Free Dictionary API 查询词典，SQLite + Prisma 持久化数据。

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, SQLite, DeepSeek API, Free Dictionary API

---

## 文件结构

```
D:\English\
├── app/
│   ├── layout.tsx              # 全局布局（导航栏、字体、样式）
│   ├── page.tsx                # 单词输入页（首页）
│   ├── article/[id]/page.tsx   # 文章阅读页
│   ├── history/page.tsx        # 历史记录页
│   ├── globals.css             # 全局样式
│   └── api/
│       ├── extract/route.ts    # 单词提取 API
│       ├── generate/route.ts   # 文章生成 API
│       ├── translate/route.ts  # 单词翻译 API
│       └── articles/
│           ├── route.ts        # 文章列表 API
│           └── [id]/route.ts   # 文章详情 API
├── components/
│   ├── WordInput.tsx           # 单词输入组件
│   ├── ArticleView.tsx         # 文章展示组件（生词高亮、点击翻译）
│   ├── WordPopup.tsx           # 单词详情弹窗（音标、释义、翻译）
│   └── DifficultySelect.tsx    # 难度选择组件
├── lib/
│   ├── deepseek.ts            # DeepSeek API 封装
│   ├── dictionary.ts          # Free Dictionary API 封装
│   └── db.ts                  # Prisma 客户端
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

---

## Task 1: 项目初始化与环境搭建

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: 初始化 Next.js 项目**

```bash
cd D:\English
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Expected: 项目初始化完成，生成基础文件结构

- [ ] **Step 2: 创建环境变量文件**

Create `.env.local`:
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 3: 创建 .gitignore**

Create `.gitignore`:
```
node_modules/
.next/
.env.local
prisma/dev.db
prisma/dev.db-journal
```

- [ ] **Step 4: 验证项目启动**

```bash
npm run dev
```

Expected: 开发服务器启动，访问 http://localhost:3000 显示默认页面

- [ ] **Step 5: 停止服务器并提交**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with TypeScript and Tailwind"
```

---

## Task 2: 数据库设计与 Prisma 配置

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Step 1: 安装 Prisma**

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

Expected: 生成 `prisma/schema.prisma` 和 `.env` 文件

- [ ] **Step 2: 定义数据模型**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Article {
  id         Int      @id @default(autoincrement())
  title      String
  content    String
  difficulty String   @default("cet4")
  createdAt  DateTime @default(now())
  words      Word[]
}

model Word {
  id         Int      @id @default(autoincrement())
  word       String
  phonetic   String?
  definition String?
  chinese    String?
  example    String?
  articleId  Int
  article    Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 3: 创建 Prisma 客户端**

Create `lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: 运行数据库迁移**

```bash
npx prisma migrate dev --name init
```

Expected: 数据库创建成功，生成 `prisma/dev.db`

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "feat: add Prisma schema with Article and Word models"
```

---

## Task 3: DeepSeek API 封装

**Files:**
- Create: `lib/deepseek.ts`

- [ ] **Step 1: 创建 DeepSeek API 封装**

Create `lib/deepseek.ts`:
```typescript
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const data: DeepSeekResponse = await response.json()
  return data.choices[0].message.content
}

export async function generateArticle(words: string[], difficulty: string): Promise<string> {
  const difficultyPrompt = difficulty === 'cet6'
    ? '文章难度适合大学英语六级水平，可使用复合句和进阶词汇，文章长度 400-500 词'
    : '文章难度适合大学英语四级水平，使用简单句式，避免过于复杂的从句，文章长度 300-400 词'

  const prompt = `你是一位英语教学专家。请用以下单词写一篇优质英语文章。

要求：
1. 文章必须自然流畅，包含所有给定单词
2. 每个单词在文中只出现一次
3. ${difficultyPrompt}
4. 主题自选，但要有教育意义
5. 输出纯文本，不要加标题

单词列表：${words.join(', ')}`

  return callDeepSeek([
    { role: 'user', content: prompt }
  ])
}

export async function translateToChinese(word: string, definition: string): Promise<string> {
  const prompt = `请将以下英文单词翻译成中文，只返回中文翻译，不要其他内容。

单词：${word}
英文释义：${definition}`

  return callDeepSeek([
    { role: 'user', content: prompt }
  ])
}
```

- [ ] **Step 2: 提交**

```bash
git add lib/deepseek.ts
git commit -m "feat: add DeepSeek API wrapper for article generation and translation"
```

---

## Task 4: Free Dictionary API 封装

**Files:**
- Create: `lib/dictionary.ts`

- [ ] **Step 1: 创建词典 API 封装**

Create `lib/dictionary.ts`:
```typescript
interface DictionaryEntry {
  word: string
  phonetic: string | null
  definition: string
  example: string | null
}

interface FreeDictResponse {
  word: string
  phonetics: Array<{
    text?: string
    audio?: string
  }>
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
      example?: string
    }>
  }>
}

export async function lookupWord(word: string): Promise<DictionaryEntry | null> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    )

    if (!response.ok) {
      return null
    }

    const data: FreeDictResponse[] = await response.json()
    if (!data || data.length === 0) {
      return null
    }

    const entry = data[0]
    const phonetic = entry.phonetics?.find(p => p.text)?.text ?? null
    const firstMeaning = entry.meanings?.[0]
    const firstDefinition = firstMeaning?.definitions?.[0]

    return {
      word: entry.word,
      phonetic,
      definition: firstDefinition?.definition ?? '',
      example: firstDefinition?.example ?? null,
    }
  } catch {
    return null
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add lib/dictionary.ts
git commit -m "feat: add Free Dictionary API wrapper"
```

---

## Task 5: 单词提取 API

**Files:**
- Create: `app/api/extract/route.ts`

- [ ] **Step 1: 创建单词提取 API**

Create `app/api/extract/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // 提取英文单词：匹配连续的英文字母
    const wordRegex = /[a-zA-Z]+/g
    const matches = text.match(wordRegex) || []

    // 转小写、去重、过滤短词
    const words = [...new Set(
      matches
        .map(w => w.toLowerCase())
        .filter(w => w.length >= 2)
    )]

    return NextResponse.json({ words })
  } catch {
    return NextResponse.json(
      { error: 'Failed to extract words' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 测试 API**

```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "1. abandon 放弃\n2. ability 能力\n3. achieve 实现"}'
```

Expected: `{"words":["abandon","ability","achieve"]}`

- [ ] **Step 3: 提交**

```bash
git add app/api/extract/route.ts
git commit -m "feat: add word extraction API endpoint"
```

---

## Task 6: 文章生成 API

**Files:**
- Create: `app/api/generate/route.ts`

- [ ] **Step 1: 创建文章生成 API**

Create `app/api/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateArticle } from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    const { words, difficulty = 'cet4' } = await request.json()

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Words array is required' },
        { status: 400 }
      )
    }

    // 调用 DeepSeek 生成文章
    const content = await generateArticle(words, difficulty)

    // 生成标题
    const title = `${difficulty.toUpperCase()} 阅读 - ${new Date().toLocaleDateString('zh-CN')}`

    // 保存文章到数据库
    const article = await prisma.article.create({
      data: {
        title,
        content,
        difficulty,
      },
    })

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
      },
    })
  } catch (error) {
    console.error('Generate article error:', error)
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/api/generate/route.ts
git commit -m "feat: add article generation API endpoint"
```

---

## Task 7: 单词翻译 API

**Files:**
- Create: `app/api/translate/route.ts`

- [ ] **Step 1: 创建单词翻译 API**

Create `app/api/translate/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lookupWord } from '@/lib/dictionary'
import { translateToChinese } from '@/lib/deepseek'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')

    if (!word) {
      return NextResponse.json(
        { error: 'Word parameter is required' },
        { status: 400 }
      )
    }

    const normalizedWord = word.toLowerCase().trim()

    // 先查缓存
    const cached = await prisma.word.findFirst({
      where: { word: normalizedWord },
    })

    if (cached) {
      return NextResponse.json({
        word: cached.word,
        phonetic: cached.phonetic,
        definition: cached.definition,
        chinese: cached.chinese,
        example: cached.example,
      })
    }

    // 查 Free Dictionary API
    const dictResult = await lookupWord(normalizedWord)

    // 调用 DeepSeek 翻译
    const chinese = await translateToChinese(
      normalizedWord,
      dictResult?.definition ?? ''
    )

    // 保存到缓存
    const wordEntry = await prisma.word.create({
      data: {
        word: normalizedWord,
        phonetic: dictResult?.phonetic ?? null,
        definition: dictResult?.definition ?? null,
        chinese,
        example: dictResult?.example ?? null,
        articleId: 0, // 通用缓存，不属于特定文章
      },
    })

    return NextResponse.json({
      word: wordEntry.word,
      phonetic: wordEntry.phonetic,
      definition: wordEntry.definition,
      chinese: wordEntry.chinese,
      example: wordEntry.example,
    })
  } catch (error) {
    console.error('Translate error:', error)
    return NextResponse.json(
      { error: 'Failed to translate word' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/api/translate/route.ts
git commit -m "feat: add word translation API with dictionary lookup and caching"
```

---

## Task 8: 文章列表与详情 API

**Files:**
- Create: `app/api/articles/route.ts`
- Create: `app/api/articles/[id]/route.ts`

- [ ] **Step 1: 创建文章列表 API**

Create `app/api/articles/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { words: true },
        },
      },
    })

    return NextResponse.json({
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        wordCount: article._count.words,
        difficulty: article.difficulty,
        createdAt: article.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('List articles error:', error)
    return NextResponse.json(
      { error: 'Failed to list articles' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 创建文章详情 API**

Create `app/api/articles/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id },
      include: { words: true },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        difficulty: article.difficulty,
        createdAt: article.createdAt.toISOString(),
        words: article.words.map(word => ({
          id: word.id,
          word: word.word,
          phonetic: word.phonetic,
          definition: word.definition,
          chinese: word.chinese,
          example: word.example,
        })),
      },
    })
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json(
      { error: 'Failed to get article' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add app/api/articles/route.ts app/api/articles/\[id\]/route.ts
git commit -m "feat: add article list and detail API endpoints"
```

---

## Task 9: 难度选择组件

**Files:**
- Create: `components/DifficultySelect.tsx`

- [ ] **Step 1: 创建难度选择组件**

Create `components/DifficultySelect.tsx`:
```typescript
'use client'

interface DifficultySelectProps {
  value: string
  onChange: (value: string) => void
}

export default function DifficultySelect({ value, onChange }: DifficultySelectProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('cet4')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          value === 'cet4'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        CET-4 四级
      </button>
      <button
        onClick={() => onChange('cet6')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          value === 'cet6'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        CET-6 六级
      </button>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add components/DifficultySelect.tsx
git commit -m "feat: add difficulty selection component"
```

---

## Task 10: 单词输入组件

**Files:**
- Create: `components/WordInput.tsx`

- [ ] **Step 1: 创建单词输入组件**

Create `components/WordInput.tsx`:
```typescript
'use client'

import { useState } from 'react'

interface WordInputProps {
  onSubmit: (words: string[], difficulty: string) => void
  loading: boolean
}

export default function WordInput({ onSubmit, loading }: WordInputProps) {
  const [text, setText] = useState('')
  const [difficulty, setDifficulty] = useState('cet4')

  const handleSubmit = async () => {
    if (!text.trim()) return

    // 调用提取 API
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    const data = await response.json()
    if (data.words && data.words.length > 0) {
      onSubmit(data.words, difficulty)
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴你的单词列表，支持任意格式：&#10;1. abandon 放弃&#10;2. ability 能力&#10;achieve, belief, confidence..."
        className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        disabled={loading}
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setDifficulty('cet4')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              difficulty === 'cet4'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            CET-4
          </button>
          <button
            onClick={() => setDifficulty('cet6')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              difficulty === 'cet6'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            CET-6
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '生成中...' : '生成文章'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add components/WordInput.tsx
git commit -m "feat: add word input component with difficulty selection"
```

---

## Task 11: 单词详情弹窗组件

**Files:**
- Create: `components/WordPopup.tsx`

- [ ] **Step 1: 创建单词详情弹窗**

Create `components/WordPopup.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'

interface WordData {
  word: string
  phonetic: string | null
  definition: string | null
  chinese: string | null
  example: string | null
}

interface WordPopupProps {
  word: string
  position: { x: number; y: number }
  onClose: () => void
}

export default function WordPopup({ word, position, onClose }: WordPopupProps) {
  const [data, setData] = useState<WordData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWord = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/translate?word=${encodeURIComponent(word)}`)
        const result = await response.json()
        setData(result)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchWord()
  }, [word])

  return (
    <div
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
    >
      <div className="bg-white rounded-lg shadow-xl border p-4 max-w-sm relative -translate-x-1/2 mt-2">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {loading ? (
          <div className="text-center py-4">加载中...</div>
        ) : data ? (
          <div className="space-y-3">
            <div>
              <span className="text-xl font-bold text-blue-600">{data.word}</span>
              {data.phonetic && (
                <span className="ml-2 text-gray-500">{data.phonetic}</span>
              )}
            </div>

            {data.chinese && (
              <div>
                <div className="text-sm text-gray-500 mb-1">中文释义</div>
                <div className="text-lg">{data.chinese}</div>
              </div>
            )}

            {data.definition && (
              <div>
                <div className="text-sm text-gray-500 mb-1">英文释义</div>
                <div className="text-sm text-gray-700">{data.definition}</div>
              </div>
            )}

            {data.example && (
              <div>
                <div className="text-sm text-gray-500 mb-1">例句</div>
                <div className="text-sm italic text-gray-600">{data.example}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">未找到释义</div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add components/WordPopup.tsx
git commit -m "feat: add word popup component with dictionary lookup"
```

---

## Task 12: 文章展示组件

**Files:**
- Create: `components/ArticleView.tsx`

- [ ] **Step 1: 创建文章展示组件**

Create `components/ArticleView.tsx`:
```typescript
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

  // 将文章内容中的生词替换为可点击的高亮元素
  const renderContent = () => {
    if (!content) return null

    // 创建匹配所有生词的正则（不区分大小写）
    const wordSet = new Set(words.map(w => w.toLowerCase()))
    const wordPattern = words
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const regex = new RegExp(`\\b(${wordPattern})\\b`, 'gi')

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      // 添加匹配前的普通文本
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      // 添加高亮的生词
      const matchedWord = match[0]
      const isTargetWord = wordSet.has(matchedWord.toLowerCase())

      if (isTargetWord) {
        parts.push(
          <span
            key={match.index}
            onClick={(e) => handleWordClick(matchedWord, e)}
            className="bg-yellow-200 hover:bg-yellow-300 cursor-pointer px-0.5 rounded transition-colors"
          >
            {matchedWord}
          </span>
        )
      } else {
        parts.push(matchedWord)
      }

      lastIndex = match.index + matchedWord.length
    }

    // 添加剩余的普通文本
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    return parts
  }

  return (
    <div className="relative">
      <div className="prose prose-lg max-w-none leading-relaxed">
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
```

- [ ] **Step 2: 提交**

```bash
git add components/ArticleView.tsx
git commit -m "feat: add article view component with clickable highlighted words"
```

---

## Task 13: 首页（单词输入页）

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 实现首页**

Modify `app/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WordInput from '@/components/WordInput'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-center mb-2">Word2Article</h1>
        <p className="text-gray-500 text-center mb-8">
          将单词变成文章，通过语境记忆单词
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <WordInput onSubmit={handleSubmit} loading={loading} />
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
    </main>
  )
}
```

- [ ] **Step 2: 启动开发服务器测试**

```bash
npm run dev
```

Expected: 首页显示单词输入框和难度选择

- [ ] **Step 3: 提交**

```bash
git add app/page.tsx
git commit -m "feat: implement home page with word input"
```

---

## Task 14: 文章阅读页

**Files:**
- Create: `app/article/[id]/page.tsx`

- [ ] **Step 1: 创建文章阅读页**

Create `app/article/[id]/page.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ArticleView from '@/components/ArticleView'

interface ArticleData {
  id: number
  title: string
  content: string
  difficulty: string
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </main>
    )
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-500">文章未找到</div>
      </main>
    )
  }

  const wordList = article.words.map(w => w.word)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{article.title}</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {article.difficulty.toUpperCase()}
            </span>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">本文章包含的单词：</div>
            <div className="flex flex-wrap gap-2">
              {article.words.map((w, i) => (
                <span key={i} className="px-2 py-1 bg-yellow-100 rounded text-sm">
                  {w.word}
                  {w.chinese && <span className="ml-1 text-gray-500">({w.chinese})</span>}
                </span>
              ))}
            </div>
          </div>

          <ArticleView content={article.content} words={wordList} />
        </div>

        <div className="mt-6 text-center space-x-4">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            生成新文章
          </a>
          <a href="/history" className="text-blue-600 hover:text-blue-800 underline">
            历史记录
          </a>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add app/article/\[id\]/page.tsx
git commit -m "feat: implement article reading page with word list"
```

---

## Task 15: 历史记录页

**Files:**
- Create: `app/history/page.tsx`

- [ ] **Step 1: 创建历史记录页**

Create `app/history/page.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'

interface ArticleSummary {
  id: number
  title: string
  wordCount: number
  difficulty: string
  createdAt: string
}

export default function HistoryPage() {
  const [articles, setArticles] = useState<ArticleSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles')
        const data = await response.json()
        setArticles(data.articles)
      } catch (error) {
        console.error('Fetch articles error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </a>
        </div>

        <h1 className="text-3xl font-bold mb-8">历史记录</h1>

        {articles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            还没有生成过文章，去首页试试吧！
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <a
                key={article.id}
                href={`/article/${article.id}`}
                className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{article.title}</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {article.difficulty.toUpperCase()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {article.wordCount} 个单词 · {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add app/history/page.tsx
git commit -m "feat: implement history page with article list"
```

---

## Task 16: 全局布局与导航

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: 更新全局布局**

Modify `app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Word2Article - 英语单词转文章学习工具',
  description: '将单词变成文章，通过语境记忆单词',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-blue-600">
              Word2Article
            </a>
            <div className="space-x-4">
              <a href="/" className="text-gray-600 hover:text-blue-600">
                首页
              </a>
              <a href="/history" className="text-gray-600 hover:text-blue-600">
                历史
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add app/layout.tsx
git commit -m "feat: add global layout with navigation bar"
```

---

## Task 17: 端到端测试

**Files:**
- None (manual testing)

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 测试完整流程**

1. 访问 http://localhost:3000
2. 在文本框输入：`abandon, ability, achieve, believe, confidence`
3. 选择 CET-4 难度
4. 点击"生成文章"
5. 等待文章生成完成
6. 点击文章中的高亮单词，验证弹窗显示音标、释义、翻译
7. 点击"历史记录"，验证文章列表显示
8. 点击文章卡片，验证可以重新查看

Expected: 所有功能正常工作

- [ ] **Step 3: 最终提交**

```bash
git add .
git commit -m "feat: complete Word2Article MVP with all core features"
```

---

## 自检结果

1. **规格覆盖**：所有核心功能都有对应任务（单词提取、文章生成、翻译、历史记录、难度选择）
2. **占位符扫描**：无 TBD/TODO，所有代码完整
3. **类型一致性**：API 响应格式、组件 props 类型在各任务间保持一致
