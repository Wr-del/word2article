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
    return {
      word: localResult.word,
      phonetic: localResult.phonetic,
      definition: localResult.definition || localResult.chinese || '',
      example: null,
    }
  }

  // 2. 本地没有，调用远程API（兜底）
  return lookupWordFromAPI(word)
}
