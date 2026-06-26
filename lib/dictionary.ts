import { lookupLocalDict } from './local-dict'

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

/**
 * 从 dictionaryapi.dev 查询单词信息
 * 主要用于获取音标和英文释义
 */
async function lookupWordFromAPI(word: string): Promise<DictionaryEntry | null> {
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

    // 优先选择名词/动词/形容词的释义，避免生僻词性
    let bestDefinition = ''
    let bestExample: string | null = null

    const preferredOrder = ['noun', 'verb', 'adjective', 'adverb']

    for (const pos of preferredOrder) {
      const meaning = entry.meanings?.find(m => m.partOfSpeech === pos)
      if (meaning?.definitions?.[0]) {
        bestDefinition = meaning.definitions[0].definition
        bestExample = meaning.definitions[0].example ?? null
        break
      }
    }

    // 如果没找到优先词性，用第一个
    if (!bestDefinition) {
      const firstMeaning = entry.meanings?.[0]
      const firstDefinition = firstMeaning?.definitions?.[0]
      bestDefinition = firstDefinition?.definition ?? ''
      bestExample = firstDefinition?.example ?? null
    }

    return {
      word: entry.word,
      phonetic,
      definition: bestDefinition,
      example: bestExample,
    }
  } catch {
    return null
  }
}

/**
 * 查询单词信息
 * 优先使用本地词典，失败则调用远程API
 */
export async function lookupWord(word: string): Promise<DictionaryEntry | null> {
  // 1. 优先查本地词典
  const localResult = lookupLocalDict(word)

  if (localResult && (localResult.chinese || localResult.definition)) {
    const definition = pickBestDefinition(localResult.definition, localResult.chinese)
    return {
      word: localResult.word,
      phonetic: localResult.phonetic,
      definition: definition || localResult.definition || '',
      example: null,
    }
  }

  // 2. 本地没有，调用远程API（兜底）
  return lookupWordFromAPI(word)
}

/**
 * 根据中文释义的词性前缀，从英文定义中选择最匹配的一条
 * ECDICT 的 definition 字段可能包含多条定义，以词性前缀分隔，如：
 *   "n. xxx a. yyy s. zzz"
 * 中文翻译通常也有词性前缀，如 "a. 中级的, 次要的"
 */
function pickBestDefinition(definition: string | null, chinese: string | null): string {
  if (!definition) return ''

  // 按词性前缀拆分英文定义
  const defParts = definition.split(/\s+(?=(?:vt\.|vi\.|n\.|a\.|ad\.|prep\.|conj\.|pron\.|int\.|art\.|num\.|aux\.|abbr\.|v\.|r\.|s\.))/).map(s => s.trim()).filter(Boolean)

  // 只有一条定义，直接返回
  if (defParts.length <= 1) return definition

  // 从中文释义中提取词性前缀
  if (chinese) {
    const posMatch = chinese.match(/^(vt\.|vi\.|n\.|a\.|ad\.|prep\.|conj\.|pron\.|int\.|art\.|num\.|aux\.|abbr\.|v\.|r\.|s\.)/)
    if (posMatch) {
      const pos = posMatch[1].toLowerCase()
      // 查找匹配词性的英文定义
      const matched = defParts.find(d => d.toLowerCase().startsWith(pos))
      if (matched) return matched
    }
  }

  // 没有匹配到，返回第一条
  return defParts[0]
}
