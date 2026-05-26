export async function extractTextFromPdf(file: File): Promise<string> {
  // 动态导入pdfjs-dist以避免服务器端渲染问题
  const pdfjsLib = await import('pdfjs-dist')

  // 设置worker
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    fullText += pageText + '\n'
  }

  return fullText
}

export function extractWordsFromText(text: string): string[] {
  // 匹配英文单词（2个字母以上）
  const wordRegex = /\b[a-zA-Z]{2,}\b/g
  const words = text.match(wordRegex) || []

  // 去重并转换为小写
  const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))]

  // 过滤常见噪音词
  const noiseWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now',
    'page', 'pdf', 'word', 'list', 'test', 'exam', 'unit', 'chapter'
  ])

  return uniqueWords.filter(word => !noiseWords.has(word))
}
