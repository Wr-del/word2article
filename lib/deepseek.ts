import { lookupLocalDict } from './local-dict'

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

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

export async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt))
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
        temperature: 0.5,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const retriable = response.status === 429 || response.status === 502 || response.status === 503
      lastError = new Error(`DeepSeek API error: ${response.status}`)
      if (retriable && attempt < MAX_RETRIES) continue
      throw lastError
    }

    const data = await response.json() as DeepSeekResponse

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('DeepSeek API returned empty response')
    }

    return data.choices[0].message.content
  }

  throw lastError ?? new Error('DeepSeek API call failed')
}

const STYLE_PROMPTS: Record<string, string> = {
  story: '撰写一个有情节的故事性文章。可以有人物、场景、对话，让读者沉浸在叙事中。故事比说明文更容易让人记住单词。',
  news: '撰写一篇新闻报道风格的文章。语言客观、结构清晰，使用新闻常见的倒金字塔结构（先给结论再展开细节）。',
  science: '撰写一篇科普说明文。用通俗易懂的语言解释某个科学概念或现象，逻辑层层递进，适合知识类阅读。',
  dialogue: '撰写一篇以对话为主体的文章。两人或多人围绕一个话题展开讨论，穿插少量叙述性描写。对话体能让单词在口语语境中自然出现。',
}

export async function generateArticle(words: string[], difficulty: string, style: string = 'story'): Promise<string> {
  const difficultyPrompts: Record<string, string> = {
    cet4: '文章难度级别：CET-4（大学英语四级）。句式以简单句为主，用词易懂，整篇文章长度控制在 300-400 词。',
    cet6: '文章难度级别：CET-6（大学英语六级）。可使用复合句和进阶词汇，整篇文章长度控制在 400-500 词。',
    ielts: '文章难度级别：IELTS（雅思）。使用学术性词汇和复杂句式，注重逻辑衔接和论证深度，整篇文章长度控制在 450-550 词。',
  }
  const difficultyPrompt = difficultyPrompts[difficulty] || difficultyPrompts.cet4

  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.story

  const prompt = `### 任务
你是一位专业的英语教学专家。请使用给定的英文单词列表，撰写一篇高质量的英语阅读文章。

### 撰写要求
1. **文章风格**：${stylePrompt}
2. **自然连贯**：所有给定的单词必须极其自然地融入语境。为了避免逻辑生硬，你可以将文章分成 2 到 3 个段落，每段围绕一个自然的主题（如健康、科技、社会等）展开，自然地消耗对应的单词。
3. **难度控制**：${difficultyPrompt}
4. **允许变形**：单词可以根据语法需要进行时态、单复数或词性变形。
5. **极致纯净输出（死命令）**：
   - 只能输出文章的英文正文内容。
   - **绝对禁止** 包含文章标题、任何 Markdown 符号（如 #、**）。
   - **绝对禁止** 输出任何前言、后记、或者单词列表。直接以正文第一句话作为开头。

### 待使用的英文单词列表
${words.join(', ')}`

  return callDeepSeek([
    {
      role: 'system',
      content: '你是一个严格执行指令的英语文章撰写助手。你只输出没有任何标题、任何特殊符号、任何多余解释的纯英文文章正文。'
    },
    {
      role: 'user',
      content: prompt
    }
  ])
}

/**
 * 将单词翻译成中文
 * 优先使用本地词典，失败则调用DeepSeek API
 */
export async function translateToChinese(word: string, definition?: string): Promise<string> {
  // 1. 优先查本地词典
  const localResult = lookupLocalDict(word)
  
  if (localResult?.chinese) {
    return localResult.chinese
  }

  // 2. 本地没有，调用DeepSeek API
  return translateToChineseFromAPI(word, definition)
}

/**
 * 调用DeepSeek API将单词翻译成中文
 */
async function translateToChineseFromAPI(word: string, definition?: string): Promise<string> {
  // 不再使用可能错误的英文释义，让 DeepSeek 直接翻译单词
  const prompt = `请将以下英文单词翻译成中文。只返回最常用、最核心的中文释义（1-3个词），不要其他内容。

单词：${word}

注意：请返回该单词最常用的意思，而不是特定语境下的含义。例如：
- "primary" 应该翻译为"主要的"，而不是"初选"
- "necessary" 应该翻译为"必要的"，而不是"厕所"
- "essential" 应该翻译为"必要的"，而不是"必要成分"
- "devise" 应该翻译为"设计，想出"，而不是"遗赠"
- "rigid" 应该翻译为"僵硬的"，而不是"硬尾车"
- "academic" 应该翻译为"学术的"，而不是"柏拉图追随者"`

  return callDeepSeek([
    {
      role: 'system',
      content: '你是一个专业的英汉词典。你只返回单词最常用、最核心的中文释义，通常是1-3个词。不要返回句子或解释。'
    },
    { role: 'user', content: prompt }
  ])
}

export async function translateArticleToChinese(content: string): Promise<string> {
  const prompt = `### 任务
请将以下英文文章翻译成纯中文。

### 严格要求
1. 译文要优雅地道，符合中文的阅读习惯（信、达、雅）。
2. **绝对禁止** 在中文译文里包含任何双星号（**）加粗符号！哪怕原文有加粗，中文也必须翻译成没有任何符号的纯文本。
3. 保持与原文完全一致的段落结构。
4. 只返回中文翻译结果，不要输出任何引言或注释。

英文文章内容：
${content}`

  return callDeepSeek([
    { 
      role: 'system', 
      content: '你是一个专业的中文翻译官。你只输出最地道、干净的纯中文翻译，绝对不保留英文中的 Markdown 加粗符号（**）。' 
    },
    { 
      role: 'user', 
      content: prompt 
    }
  ])
}