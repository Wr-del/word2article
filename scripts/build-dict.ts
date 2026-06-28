import fs from 'fs'
import path from 'path'
import readline from 'readline'

interface EcdictRow {
  word: string
  phonetic: string
  definition: string
  translation: string
  pos: string
  collins: string
  oxford: string
  tag: string
  bnc: string
  frq: string
  exchange: string
  detail: string
  audio: string
}

interface DictEntry {
  p?: string    // phonetic
  d?: string    // definition
  t?: string    // translation
  e?: string    // exchange
}

// 输出目录
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'dict')

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

/**
 * 解析 CSV 行
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++ // 跳过下一个引号
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

/**
 * 处理 ECDICT CSV 文件
 */
async function processEcdict(csvPath: string): Promise<void> {
  console.log(`Processing ECDICT from: ${csvPath}`)
  
  // 按首字母分组存储
  const dictByLetter: Record<string, Record<string, DictEntry>> = {}
  
  // 初始化26个字母
  for (let i = 97; i <= 122; i++) {
    dictByLetter[String.fromCharCode(i)] = {}
  }
  
  let totalWords = 0
  let processedWords = 0
  
  // 创建读取流
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf-8' })
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  
  let isFirstLine = true
  let headers: string[] = []
  
  for await (const line of rl) {
    // 跳过表头
    if (isFirstLine) {
      headers = parseCsvLine(line)
      isFirstLine = false
      continue
    }
    
    totalWords++
    
    try {
      const values = parseCsvLine(line)
      
      // 构建对象
      const row: Record<string, string> = {}
      for (let i = 0; i < headers.length && i < values.length; i++) {
        row[headers[i]] = values[i]
      }
      
      const word = (row.word || '').toLowerCase().trim()
      
      // 跳过无效单词
      if (!word || word.length < 2 || !/^[a-z]+$/.test(word)) {
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
      
      // 只保存有中文释义的单词
      if (entry.t && entry.t.length > 0) {
        dictByLetter[firstChar][word] = entry
        processedWords++
      }
      
    } catch (error) {
      // 忽略解析错误的行
      continue
    }
    
    // 进度显示
    if (totalWords % 10000 === 0) {
      console.log(`Processed ${totalWords} words...`)
    }
  }
  
  console.log(`\nTotal words: ${totalWords}`)
  console.log(`Words with Chinese translation: ${processedWords}`)
  
  // 写入 JSON 文件
  console.log('\nWriting dict files...')
  
  for (const [letter, words] of Object.entries(dictByLetter)) {
    const wordCount = Object.keys(words).length
    
    if (wordCount > 0) {
      const filePath = path.join(OUTPUT_DIR, `${letter}.json`)
      fs.writeFileSync(filePath, JSON.stringify(words), 'utf-8')
      console.log(`${letter}.json: ${wordCount} words`)
    }
  }
  
  console.log('\nDone!')
}

// 主函数
async function main() {
  const csvPath = path.join(process.cwd(), 'ecdict.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error('Error: ecdict.csv not found!')
    console.log('\nPlease download ECDICT from:')
    console.log('https://github.com/skywind3000/ECDICT')
    console.log('\nDownload the ecdict.csv file and place it in the project root directory.')
    process.exit(1)
  }
  
  await processEcdict(csvPath)
}

main().catch(console.error)
