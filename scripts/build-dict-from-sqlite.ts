import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

// 输出目录
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'dict')

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

interface DictEntry {
  p?: string    // phonetic
  d?: string    // definition
  t?: string    // translation
  e?: string    // exchange
}

interface StardictRow {
  word: string
  phonetic: string | null
  definition: string | null
  translation: string | null
  exchange: string | null
  tag: string | null
  bnc: number | null
  frq: number | null
}

/**
 * 从 SQLite 数据库导出词典
 */
function exportDictFromSqlite(dbPath: string): void {
  console.log(`Opening database: ${dbPath}`)
  
  const db = new Database(dbPath, { readonly: true })
  
  // 获取总词数
  const countResult = db.prepare('SELECT COUNT(*) as count FROM stardict').get() as { count: number }
  console.log(`Total words in database: ${countResult.count}`)
  
  // 按首字母分组存储
  const dictByLetter: Record<string, Record<string, DictEntry>> = {}
  
  // 初始化26个字母
  for (let i = 97; i <= 122; i++) {
    dictByLetter[String.fromCharCode(i)] = {}
  }
  
  // 查询所有单词
  const stmt = db.prepare(`
    SELECT word, phonetic, definition, translation, exchange, tag, bnc, frq 
    FROM stardict 
    WHERE word IS NOT NULL AND translation IS NOT NULL
    ORDER BY word
  `)
  
  let processed = 0
  let skipped = 0
  
  for (const row of stmt.iterate() as IterableIterator<StardictRow>) {
    const word = (row.word || '').toLowerCase().trim()
    
    // 跳过无效单词
    if (!word || word.length < 2 || !/^[a-z]+$/.test(word)) {
      skipped++
      continue
    }
    
    // 获取首字母
    const firstChar = word[0]
    
    // 构建词典条目
    const entry: DictEntry = {}
    
    // 音标
    if (row.phonetic) {
      entry.p = row.phonetic
    }
    
    // 英文释义
    if (row.definition) {
      // 清理释义，去除换行符
      entry.d = row.definition.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
    }
    
    // 中文释义
    if (row.translation) {
      // 清理翻译，去除换行符
      entry.t = row.translation.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
    }
    
    // 变形信息
    if (row.exchange) {
      entry.e = row.exchange
    }
    
    // 保存到对应字母的词典
    dictByLetter[firstChar][word] = entry
    
    processed++
    
    // 进度显示
    if (processed % 10000 === 0) {
      console.log(`Processed ${processed} words...`)
    }
  }
  
  db.close()
  
  console.log(`\nProcessed: ${processed}`)
  console.log(`Skipped: ${skipped}`)
  
  // 写入 JSON 文件
  console.log('\nWriting dict files...')
  
  let totalWords = 0
  
  for (const [letter, words] of Object.entries(dictByLetter)) {
    const wordCount = Object.keys(words).length
    
    if (wordCount > 0) {
      const filePath = path.join(OUTPUT_DIR, `${letter}.json`)
      fs.writeFileSync(filePath, JSON.stringify(words), 'utf-8')
      console.log(`${letter}.json: ${wordCount} words`)
      totalWords += wordCount
    }
  }
  
  console.log(`\nTotal words exported: ${totalWords}`)
  console.log('Done!')
}

// 主函数
function main() {
  const dbPath = path.join(process.cwd(), 'ecdict-sqlite', 'stardict.db')
  
  if (!fs.existsSync(dbPath)) {
    console.error('Error: stardict.db not found!')
    console.log('\nPlease download ECDICT SQLite version from:')
    console.log('https://github.com/skywind3000/ECDICT/releases')
    process.exit(1)
  }
  
  exportDictFromSqlite(dbPath)
}

main()
