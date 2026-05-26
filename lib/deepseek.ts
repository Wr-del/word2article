const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const data: DeepSeekResponse = await response.json()
  return data.choices[0].message.content
}

export async function generateArticle(words: string[], difficulty: string): Promise<string> {
  const difficultyPrompt = difficulty === 'cet6'
    ? '文章难度适合大学英语六级水平，可使用复合句和进阶词汇，文章长度 400-500 词'
    : '文章难度适合大学英语四级水平，使用简单句式，避免过于复杂的从句，文章长度 300-400 词'

  const prompt = `你是一位英语教学专家。请用以下单词写一篇优质英语文章。

要求：
1. 文章必须自然流畅，包含所有给定单词
2. 每个单词在文中只出现一次
3. ${difficultyPrompt}
4. 主题自选，但要有教育意义
5. 输出纯文本，不要加标题

单词列表：${words.join(', ')}`

  return callDeepSeek([
    { role: 'user', content: prompt }
  ])
}

export async function translateToChinese(word: string, definition: string): Promise<string> {
  const prompt = `请将以下英文单词翻译成中文，只返回中文翻译，不要其他内容。

单词：${word}
英文释义：${definition}`

  return callDeepSeek([
    { role: 'user', content: prompt }
  ])
}
