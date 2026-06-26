import fs from 'fs'
import path from 'path'
import { getLemmas } from './lemmatizer'

interface LocalDictEntry {
  word: string
  phonetic: string | null
  definition: string | null
  chinese: string | null
  exchange: string | null
}

interface DictData {
  [word: string]: {
    p?: string    // phonetic
    d?: string    // definition (英文)
    t?: string    // translation (中文)
    e?: string    // exchange
  }
}

// 缓存已加载的词典文件
const dictCache = new Map<string, DictData>()

// 缓存已查询的单词结果
const queryCache = new Map<string, LocalDictEntry | null>()

// 最大查询缓存数
const MAX_QUERY_CACHE = 2000

// 词典数据目录
const DICT_DIR = path.join(process.cwd(), 'data', 'dict')

// 如果当前目录不是项目根目录，尝试向上查找
function findDictDir(): string {
  let currentDir = process.cwd()
  
  // 检查当前目录
  if (fs.existsSync(path.join(currentDir, 'data', 'dict'))) {
    return path.join(currentDir, 'data', 'dict')
  }
  
  // 向上查找最多3级目录
  for (let i = 0; i < 3; i++) {
    currentDir = path.dirname(currentDir)
    if (fs.existsSync(path.join(currentDir, 'data', 'dict'))) {
      return path.join(currentDir, 'data', 'dict')
    }
  }
  
  // 返回默认路径
  return DICT_DIR
}

const dictDir = findDictDir()

/**
 * 加载指定字母的词典文件
 */
function loadDictFile(letter: string): DictData | null {
  if (dictCache.has(letter)) {
    return dictCache.get(letter)!
  }

  const filePath = path.join(dictDir, `${letter}.json`)
  
  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const data: DictData = JSON.parse(content)
    dictCache.set(letter, data)
    return data
  } catch (error) {
    console.error(`Failed to load dict file ${letter}.json:`, error)
    return null
  }
}

/**
 * 从本地词典查询单词
 */
export function lookupLocalDict(word: string): LocalDictEntry | null {
  const normalizedWord = word.toLowerCase().trim()
  
  if (!normalizedWord || normalizedWord.length < 2) {
    return null
  }

  // 检查查询缓存
  if (queryCache.has(normalizedWord)) {
    return queryCache.get(normalizedWord)!
  }

  // 获取单词首字母
  const firstChar = normalizedWord[0]
  
  if (!/^[a-z]$/.test(firstChar)) {
    return null
  }

  // 加载对应字母的词典
  const dictData = loadDictFile(firstChar)
  
  if (!dictData) {
    queryCache.set(normalizedWord, null)
    return null
  }

  // 直接查找
  const entry = dictData[normalizedWord]
  
  if (entry) {
    const result: LocalDictEntry = {
      word: normalizedWord,
      phonetic: entry.p || null,
      definition: entry.d || null,
      chinese: entry.t || null,
      exchange: entry.e || null
    }
    
    // 缓存结果
    if (queryCache.size >= MAX_QUERY_CACHE) {
      // 删除最早的缓存项
      const firstKey = queryCache.keys().next().value
      if (firstKey !== undefined) {
        queryCache.delete(firstKey)
      }
    }
    queryCache.set(normalizedWord, result)
    
    return result
  }

  // 尝试词形还原查找
  const lemmas = getLemmas(normalizedWord)
  for (const lemma of lemmas) {
    if (lemma !== normalizedWord) {
      const lemmaEntry = dictData[lemma]
      if (lemmaEntry) {
        const result: LocalDictEntry = {
          word: normalizedWord,
          phonetic: lemmaEntry.p || null,
          definition: lemmaEntry.d || null,
          chinese: lemmaEntry.t || null,
          exchange: lemmaEntry.e || null
        }

        queryCache.set(normalizedWord, result)
        return result
      }
    }
  }

  queryCache.set(normalizedWord, null)
  return null
}

/**
 * 预加载常用字母的词典（可选）
 */
export function preloadDict(letters: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']): void {
  for (const letter of letters) {
    loadDictFile(letter)
  }
}

/**
 * 清空缓存
 */
export function clearDictCache(): void {
  dictCache.clear()
  queryCache.clear()
}

export default {
  lookupLocalDict,
  preloadDict,
  clearDictCache
}
