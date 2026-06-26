<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Word2Article — 英语单词转文章学习工具

## Stack

- **Next.js 16.2.6** (App Router) + **React 19** + **TypeScript 5**
- **Prisma** (PostgreSQL — schema uses `postgresql` provider, `dev.db` is SQLite for dictionary data only)
- **Tailwind CSS 4** via `@tailwindcss/postcss` (v4 syntax — uses `@import "tailwindcss"`, NOT `@tailwind base` etc.)
- **DeepSeek API** for article generation and translation
- Path alias: `@/*` → `./*` (tsconfig paths)

## Commands

```bash
npm run dev          # next dev
npm run build        # prisma generate && next build  (order matters)
npm run lint         # eslint (flat config, eslint.config.mjs)
npx tsc --noEmit     # typecheck (no dedicated script)
npm run build-dict   # rebuild local dictionary from ECDICT CSV (ecdict.csv)
npm run build-dict-sqlite  # rebuild from ECDICT SQLite (ecdict-sqlite/)
npm run download-dict      # download ECDICT data (bash)
```

No test runner is configured. Root-level `test-*.ts` files are throwaway scripts, gitignored.

## Environment

Required env vars (`.env` / `.env.local`):
- `DATABASE_URL` — PostgreSQL connection string (Prisma datasource)
- `DEEPSEEK_API_KEY` — DeepSeek API key for article generation + translation

## Architecture

```
app/
  api/
    generate/     # POST: words[] → AI article → save to DB
    articles/     # CRUD for articles
    extract/      # word extraction
    favorites/    # word favorites (生词本)
    parse-pdf/    # PDF word list import
    quiz/         # quiz mode
    translate/    # translation endpoint
  article/[id]/   # article detail page
  quiz/[id]/      # quiz page
  favorites/      # favorites list
  history/        # history list
lib/
  db.ts           # Prisma client singleton (globalThis cache pattern)
  deepseek.ts     # DeepSeek API calls (article gen, translation)
  dictionary.ts   # word lookup: local dict → dictionaryapi.dev fallback
  local-dict.ts   # loads data/dict/{letter}.json, per-letter file cache
  lemmatizer.ts   # word deformation detection (irregular + rule-based)
components/       # React client components
prisma/
  schema.prisma   # Article, Word, Favorite models (PostgreSQL)
  migrations/     # Prisma migrations
scripts/
  build-dict.ts   # builds local dict JSON from ECDICT CSV
  build-dict-from-sqlite.ts  # builds local dict JSON from ECDICT SQLite
  download-dict.sh           # downloads ECDICT data
```

## Key Patterns

- **Prisma singleton**: `lib/db.ts` caches the PrismaClient on `globalThis` to avoid connection exhaustion in dev HMR. Don't create new PrismaClient instances elsewhere.
- **Dictionary priority**: `lookupWord()` tries local dict first (`data/dict/{letter}.json`), falls back to dictionaryapi.dev. `translateToChinese()` tries local dict first, falls back to DeepSeek API.
- **Build requires Prisma**: `npm run build` runs `prisma generate` before `next build`. Vercel build is `prisma migrate deploy && prisma generate && next build`. Never skip the generate step.
- **Local dict files**: JSON files in `data/dict/` keyed by first letter (a.json–z.json). These are gitignored — run `npm run build-dict` to regenerate from ECDICT. Source data: `ecdict.csv.7z` (CSV) or `ecdict-sqlite/` (SQLite).
- **Path alias**: Always use `@/` imports, not relative paths like `../../lib/db`.

## UI Conventions

- Dark theme: `bg-[#03060c]`, `text-slate-200`
- Brand color: emerald (`brand-500: #10b981`) — defined in `globals.css` CSS variables
- Glass morphism cards: use `.glass-card` class (includes backdrop blur + noise texture)
- Language: UI text is Chinese (zh-CN), article content is English
