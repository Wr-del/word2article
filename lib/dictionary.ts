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
