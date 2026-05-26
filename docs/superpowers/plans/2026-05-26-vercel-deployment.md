# Vercel部署实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将Word2Article应用部署到Vercel，支持手机等多设备同步使用

**Architecture:** 使用Vercel Postgres替代SQLite，Python Serverless Function处理PDF解析，Next.js应用部署到Vercel

**Tech Stack:** Next.js 16.2.6, Prisma, Vercel Postgres, Python 3.9, pdfplumber

---

## 文件结构

### 新建文件
- `api/parse-pdf/index.py` - Python Serverless Function入口
- `api/parse-pdf/requirements.txt` - Python依赖
- `vercel.json` - Vercel配置

### 修改文件
- `prisma/schema.prisma` - 修改provider为postgresql
- `app/api/parse-pdf/route.ts` - 调用Python函数
- `lib/db.ts` - 更新数据库连接配置

---

## Task 1: 修改Prisma Schema适配PostgreSQL

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 修改schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Article {
  id          Int      @id @default(autoincrement())
  title       String
  content     String
  translation String?
  difficulty  String   @default("cet4")
  createdAt   DateTime @default(now())
  words       Word[]
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

- [ ] **Step 2: 验证schema语法**

```bash
npx prisma validate
```

Expected: Valid schema

- [ ] **Step 3: 提交**

```bash
git add prisma/schema.prisma
git commit -m "feat: 修改Prisma schema适配PostgreSQL"
```

---

## Task 2: 创建Python Serverless Function

**Files:**
- Create: `api/parse-pdf/index.py`
- Create: `api/parse-pdf/requirements.txt`

- [ ] **Step 1: 创建requirements.txt**

```
pdfplumber>=0.10.0
```

- [ ] **Step 2: 创建Python函数**

```python
import json
import sys
import os

# 添加scripts目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))

from pdf_parser import extract_words_from_pdf

def handler(request):
    """Vercel Python Serverless Function handler"""
    try:
        # 获取上传的文件
        if request.method != 'POST':
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }

        # 从请求体获取PDF文件
        content_type = request.headers.get('content-type', '')
        if 'multipart/form-data' not in content_type:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Content-Type must be multipart/form-data'})
            }

        # 解析multipart form data
        body = request.body
        if isinstance(body, str):
            body = body.encode()

        # 简单的multipart解析
        boundary = content_type.split('boundary=')[1]
        parts = body.split(f'--{boundary}'.encode())

        pdf_data = None
        for part in parts:
            if b'filename="' in part and b'.pdf' in part:
                # 提取文件内容
                header_end = part.find(b'\r\n\r\n')
                if header_end != -1:
                    pdf_data = part[header_end + 4:]
                    # 移除尾部的\r\n
                    if pdf_data.endswith(b'\r\n'):
                        pdf_data = pdf_data[:-2]

        if not pdf_data:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No PDF file found'})
            }

        # 保存临时文件并解析
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(pdf_data)
            tmp_path = tmp.name

        try:
            words = extract_words_from_pdf(tmp_path)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'words': words})
            }
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

- [ ] **Step 3: 提交**

```bash
git add api/parse-pdf/
git commit -m "feat: 创建Python Serverless Function"
```

---

## Task 3: 修改PDF解析API调用Python函数

**Files:**
- Modify: `app/api/parse-pdf/route.ts`

- [ ] **Step 1: 修改route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // 调用Python Serverless Function
    const pythonFunctionUrl = process.env.PYTHON_FUNCTION_URL || '/api/parse-pdf/python'

    const pythonFormData = new FormData()
    pythonFormData.append('file', file)

    const response = await fetch(pythonFunctionUrl, {
      method: 'POST',
      body: pythonFormData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Python function failed')
    }

    const data = await response.json()
    return NextResponse.json({ words: data.words })
  } catch (error) {
    console.error('PDF parsing error:', error)
    return NextResponse.json(
      { error: 'Failed to parse PDF' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/api/parse-pdf/route.ts
git commit -m "feat: 修改PDF解析API调用Python函数"
```

---

## Task 4: 创建Vercel配置

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: 创建vercel.json**

```json
{
  "functions": {
    "api/parse-pdf/index.py": {
      "runtime": "python3.9"
    }
  },
  "rewrites": [
    {
      "source": "/api/parse-pdf/python",
      "destination": "/api/parse-pdf"
    }
  ]
}
```

- [ ] **Step 2: 提交**

```bash
git add vercel.json
git commit -m "feat: 添加Vercel配置"
```

---

## Task 5: 本地测试PostgreSQL连接

**Files:**
- Test: 本地数据库连接

- [ ] **Step 1: 创建.env.local文件**

```bash
# 本地PostgreSQL连接字符串
DATABASE_URL="postgresql://user:password@localhost:5432/word2article"

# DeepSeek API密钥
DEEPSEEK_API_KEY="your_api_key_here"
```

- [ ] **Step 2: 运行数据库迁移**

```bash
npx prisma migrate dev --name init-postgresql
```

Expected: Migration成功创建

- [ ] **Step 3: 测试数据库连接**

```bash
npx prisma studio
```

Expected: 可以打开Prisma Studio并查看数据

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: 添加PostgreSQL配置和迁移"
```

---

## Task 6: 部署到Vercel

**Files:**
- Test: Vercel部署

- [ ] **Step 1: 推送代码到GitHub**

```bash
git add .
git commit -m "feat: 准备Vercel部署"
git push origin master
```

- [ ] **Step 2: 在Vercel导入项目**

1. 访问 https://vercel.com
2. 点击 "New Project"
3. 导入GitHub仓库
4. 配置环境变量:
   - `DATABASE_URL` - Vercel Postgres连接字符串
   - `DEEPSEEK_API_KEY` - DeepSeek API密钥

- [ ] **Step 3: 配置构建设置**

在Vercel项目设置中:
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

- [ ] **Step 4: 部署**

点击 "Deploy" 按钮，等待部署完成

- [ ] **Step 5: 测试部署**

1. 访问Vercel提供的URL
2. 测试首页加载
3. 测试文章生成功能
4. 测试PDF导入功能
5. 测试历史记录功能

---

## 验收标准

- [ ] 应用可通过公网URL访问
- [ ] 手机浏览器可正常使用
- [ ] PDF导入功能正常工作
- [ ] 文章生成功能正常工作
- [ ] 历史记录可正常查看和删除
- [ ] 数据持久化存储

---

## 注意事项

1. **数据库迁移**: SQLite和PostgreSQL语法有差异，需要测试兼容性
2. **Python Runtime**: Vercel Python函数有冷启动时间，首次调用可能较慢
3. **文件大小限制**: Vercel Serverless Functions有10MB限制
4. **超时限制**: Vercel函数默认10秒超时，可配置到60秒
5. **环境变量**: 确保在Vercel正确配置所有环境变量
