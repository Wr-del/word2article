# Word2Article - 英语单词转文章学习工具设计文档

## 项目概述

### 核心目标
将用户背诵的单词列表自动生成优质英语阅读文章，通过语境辅助单词记忆。

### 目标用户
英语学习者，主攻四六级考试。

### 核心使用场景
用户背了 50 个单词，粘贴到工具中，自动生成一篇包含这些单词的英语文章。文章中生词高亮标记，点击可查看音标、英文释义、中文翻译和例句。

---

## 技术方案

### 技术栈

| 层面 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 14 (App Router) | 前后端一体 |
| 语言 | TypeScript | 类型安全 |
| 样式 | Tailwind CSS | 原子化 CSS，快速开发 |
| 数据库 | SQLite + Prisma | 轻量 ORM |
| AI 生成 | DeepSeek API | 生成文章、中文翻译 |
| 词典 | Free Dictionary API | 英文释义、音标、例句 |
| 部署 | Vercel | 免费额度足够个人使用 |

### 选型理由

- **Next.js 全栈**：一个项目搞定前后端，API Routes 直接调用外部服务，后续做小程序只需换前端
- **DeepSeek**：国内直连，价格便宜，支持中英文生成
- **Free Dictionary API**：完全免费无限制，提供音标、词性、英文例句
- **SQLite**：无需额外数据库服务，开发阶段足够，后续可迁移到 PostgreSQL

---

## 系统架构

```
┌─────────────────────────────────────────────┐
│                  用户浏览器                    │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ 单词输入  │  │ 文章阅读  │  │ 历史记录    │ │
│  │ 页面     │  │ 页面     │  │ 页面        │ │
│  └────┬────┘  └─────┬────┘  └──────┬──────┘ │
└───────┼─────────────┼──────────────┼─────────┘
        │             │              │
┌───────▼─────────────▼──────────────▼─────────┐
│              Next.js API Routes              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ /api/    │ │ /api/    │ │ /api/        │ │
│  │ extract  │ │ generate │ │ translate    │ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │            │              │          │
│       │      ┌─────▼─────┐  ┌────▼────┐    │
│       │      │ DeepSeek  │  │ Free    │    │
│       │      │   API     │  │ Dict API│    │
│       │      └───────────┘  └─────────┘    │
│       │                                      │
│  ┌────▼──────────────────────────────────┐  │
│  │           SQLite 数据库                │  │
│  │  articles 表 | words 表               │  │
│  └───────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 核心流程

1. 用户输入/粘贴单词列表
2. 后端提取清洗（正则过滤中文、数字、标点，去重）
3. 调用 DeepSeek 生成包含这些单词的文章
4. 返回前端，生词高亮标记
5. 点击生词 → 查 Free Dictionary API（英文释义、音标）+ DeepSeek（中文翻译）
6. 文章和单词自动保存到 SQLite

---

## 页面设计

### 页面一：单词输入页（首页）

- 文本框：粘贴单词列表（支持中英文混合、带编号、带释义的杂乱文本）
- 难度选择按钮组：CET-4 / CET-6，默认 CET-4
- "生成文章"按钮
- 后续增强：图片上传 OCR、墨墨/Anki 导入

### 页面二：文章阅读页

- 文章正文展示，生词用高亮标记
- 点击生词弹出浮窗：音标 + 英文释义 + 中文翻译 + 例句
- 顶部显示本次使用的单词列表
- "复制文章" / "保存"按钮

### 页面三：历史记录页

- 按时间倒序展示生成过的文章
- 点击可重新查看文章（生词仍可点击翻译）
- 显示每篇文章使用的单词数量

---

## 难度等级

| 等级 | 说明 | 文章特点 |
|------|------|---------|
| CET-4 | 四级难度 | 基础词汇为主，句式简单，300-400 词 |
| CET-6 | 六级难度 | 进阶词汇，复杂句式，400-500 词 |

难度影响 Prompt 参数：文章长度、句式复杂度、用词范围。

---

## 数据模型

### articles 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 自增主键 |
| title | TEXT | 文章标题（自动生成） |
| content | TEXT | 文章正文（带生词标记的 HTML） |
| difficulty | TEXT | 难度等级（cet4/cet6） |
| created_at | DATETIME | 创建时间 |

### words 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 自增主键 |
| word | TEXT | 英文单词 |
| phonetic | TEXT | 音标 |
| definition | TEXT | 英文释义 |
| chinese | TEXT | 中文翻译 |
| example | TEXT | 例句 |
| article_id | INTEGER | 关联的文章 ID（外键） |

**关系**：一篇文章包含多个单词，一个单词属于一篇文章（一对多）

**生词标记方案**：文章 content 中用 `<span class="word" data-word-id="123">achieve</span>` 包裹生词，前端点击时根据 word-id 查询单词详情。

---

## API 设计

### POST /api/extract - 单词提取

**请求**：
```json
{
  "text": "1. abandon 放弃\n2. ability 能力\n3. achieve 实现"
}
```

**响应**：
```json
{
  "words": ["abandon", "ability", "achieve"]
}
```

**处理逻辑**：
1. 正则提取英文单词
2. 过滤中文、数字、标点
3. 去重、转小写

### POST /api/generate - 文章生成

**请求**：
```json
{
  "words": ["abandon", "ability", "achieve"],
  "difficulty": "cet4"
}
```

**响应**：
```json
{
  "article": {
    "id": 1,
    "title": "The Journey of Growth",
    "content": "..."
  },
  "words": [...]
}
```

**处理逻辑**：
1. 根据 difficulty 构建 Prompt
2. 调用 DeepSeek API 生成文章
3. 解析文章，标记生词位置
4. 保存到数据库

### GET /api/translate?word=achieve - 单词翻译

**响应**：
```json
{
  "word": "achieve",
  "phonetic": "/əˈtʃiːv/",
  "definition": "to succeed in finishing something or reaching an aim",
  "chinese": "达到，实现；获得成功",
  "example": "She finally achieved her goal of becoming a doctor."
}
```

**处理逻辑**：
1. 先查 SQLite 缓存
2. 无缓存 → 查 Free Dictionary API
3. 再调 DeepSeek 做英译中
4. 结果存入 words 表缓存

### GET /api/articles - 历史文章列表

**响应**：
```json
{
  "articles": [
    {
      "id": 1,
      "title": "The Journey of Growth",
      "wordCount": 50,
      "difficulty": "cet4",
      "createdAt": "2026-05-26T10:00:00Z"
    }
  ]
}
```

### GET /api/articles/:id - 文章详情

返回文章完整内容及关联的单词列表。

---

## DeepSeek Prompt 策略

### 文章生成 Prompt

**CET-4 版本**：
```
你是一位英语教学专家。请用以下单词写一篇优质英语文章。

要求：
1. 文章必须自然流畅，包含所有给定单词
2. 每个单词在文中只出现一次
3. 文章难度适合大学英语四级水平，使用简单句式，避免过于复杂的从句
4. 文章长度 300-400 词
5. 主题自选，但要有教育意义
6. 输出纯文本，不要加标题

单词列表：{words}
```

**CET-6 版本**：
```
你是一位英语教学专家。请用以下单词写一篇优质英语文章。

要求：
1. 文章必须自然流畅，包含所有给定单词
2. 每个单词在文中只出现一次
3. 文章难度适合大学英语六级水平，可使用复合句和进阶词汇
4. 文章长度 400-500 词
5. 主题自选，但要有教育意义
6. 输出纯文本，不要加标题

单词列表：{words}
```

### 单词翻译 Prompt

```
请将以下英文单词翻译成中文，返回 JSON 格式：
{
  "chinese": "中文翻译",
  "partOfSpeech": "词性"
}

单词：{word}
英文释义：{definition}
```

---

## 目录结构

```
D:\English\
├── app/
│   ├── layout.tsx              # 全局布局
│   ├── page.tsx                # 单词输入页（首页）
│   ├── article/[id]/page.tsx   # 文章阅读页
│   ├── history/page.tsx        # 历史记录页
│   └── api/
│       ├── extract/route.ts    # 单词提取 API
│       ├── generate/route.ts   # 文章生成 API
│       ├── translate/route.ts  # 单词翻译 API
│       └── articles/
│           ├── route.ts        # 文章列表 API
│           └── [id]/route.ts   # 文章详情 API
├── components/
│   ├── WordInput.tsx           # 单词输入组件
│   ├── ArticleView.tsx        # 文章展示组件
│   ├── WordPopup.tsx          # 单词详情弹窗
│   └── DifficultySelect.tsx   # 难度选择组件
├── lib/
│   ├── deepseek.ts            # DeepSeek API 封装
│   ├── dictionary.ts          # Free Dictionary API 封装
│   └── db.ts                  # 数据库连接
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 后续增强（MVP 之后）

1. **单词识别增强**
   - 图片 OCR 识别单词
   - 对接墨墨背单词、Anki 导出格式

2. **学习系统**
   - 生词本功能
   - 复习计划（基于遗忘曲线）
   - 学习统计（每日学习量、掌握率）

3. **微信小程序**
   - 复用后端 API
   - 前端用小程序框架重写

4. **难度扩展**
   - 雅思、托福、GRE 等级
   - 自定义难度参数

---

## 设计决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 框架 | Next.js 全栈 | 一个项目搞定前后端，后续迁移到小程序只需换前端 |
| AI 服务 | DeepSeek | 国内直连，价格便宜 |
| 词典 API | Free Dictionary API + DeepSeek 英译中 | 免费无限制 + 零额外成本 |
| 数据库 | SQLite | 无需额外服务，开发简单 |
| 单词翻译 | 点击时实时查询 | 避免生成时大量 API 调用，结果可缓存 |
