# Vercel部署设计文档

## 概述

将Word2Article应用从本地部署迁移到Vercel云平台，支持手机等多设备同步使用。

## 目标

1. 应用可通过公网URL访问
2. 支持手机、平板等多设备同步使用
3. 保留PDF解析功能（使用pdfplumber）
4. 数据持久化存储

## 技术架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel                              │
├─────────────────────────────────────────────────────────┤
│  Next.js App (前端 + API Routes)                         │
│  ├── /api/generate     → 文章生成                        │
│  ├── /api/articles     → 文章管理                        │
│  ├── /api/extract      → 单词提取                        │
│  └── /api/parse-pdf    → 调用Python函数                  │
├─────────────────────────────────────────────────────────┤
│  Python Serverless Function                              │
│  └── pdf_parser.py     → pdfplumber解析                  │
├─────────────────────────────────────────────────────────┤
│  Vercel Postgres                                         │
│  └── Article + Word 表                                   │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

- **前端**: Next.js 16.2.6 + React 19 + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Vercel Postgres (PostgreSQL)
- **PDF解析**: Vercel Python Serverless Function + pdfplumber
- **AI服务**: DeepSeek API

## 关键改动

### 1. 数据库迁移

**当前**: SQLite文件 (prisma/dev.db)
**目标**: Vercel Postgres

需要修改:
- `prisma/schema.prisma` - 修改provider为postgresql
- `prisma/migrations/` - 创建新的迁移文件
- `lib/db.ts` - 更新连接配置

### 2. PDF解析改造

**当前**: 本地Python脚本 (scripts/pdf_parser.py)
**目标**: Vercel Python Serverless Function

需要修改:
- 创建 `api/parse-pdf/index.py` - Python函数入口
- 修改 `app/api/parse-pdf/route.ts` - 调用Python函数
- 添加 `requirements.txt` - Python依赖

### 3. 环境变量配置

需要在Vercel配置:
- `DATABASE_URL` - Vercel Postgres连接字符串
- `DEEPSEEK_API_KEY` - DeepSeek API密钥

### 4. Vercel配置

创建 `vercel.json`:
```json
{
  "functions": {
    "api/parse-pdf/index.py": {
      "runtime": "python3.9"
    }
  }
}
```

## 部署步骤

### 第一步: 数据库准备

1. 在Vercel Dashboard创建Postgres数据库
2. 获取连接字符串
3. 修改Prisma schema适配PostgreSQL
4. 运行数据库迁移

### 第二二步: Python函数准备

1. 创建Python函数目录结构
2. 配置requirements.txt
3. 测试Python函数

### 第三步: 环境变量配置

1. 在Vercel配置环境变量
2. 本地测试连接

### 第四步: 部署

1. 推送代码到GitHub
2. 在Vercel导入项目
3. 配置构建设置
4. 部署并测试

## 注意事项

1. **数据库迁移**: SQLite和PostgreSQL语法有差异，需要测试兼容性
2. **Python Runtime**: Vercel Python函数有冷启动时间，首次调用可能较慢
3. **文件大小限制**: Vercel Serverless Functions有10MB限制
4. **超时限制**: Vercel函数默认10秒超时，可配置到60秒

## 验收标准

- [ ] 应用可通过公网URL访问
- [ ] 手机浏览器可正常使用
- [ ] PDF导入功能正常工作
- [ ] 文章生成功能正常工作
- [ ] 历史记录可正常查看和删除
- [ ] 数据持久化存储
