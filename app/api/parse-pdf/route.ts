import { NextRequest, NextResponse } from 'next/server'
import PDFParser from 'pdf2json'

interface PdfTextRun { T: string }
interface PdfTextObj { x: number; y: number; R: PdfTextRun[] }
interface PdfPage { Texts: PdfTextObj[] }
interface PdfData { Pages: PdfPage[] }

// 噪音词过滤列表
const NOISE_WORDS = new Set([
  'word', 'meaning', 'phonetic', 'example', 'translation',
  '专单', '不背单词', '单词', '释义', '音标', '例句',
  'adv', 'adj', 'vi', 'vt', 'n', 'vlink', 'prep', 'conj', 'pron', 'int', 'art',
  'page', 'total', 'list', 'unit', 'lesson', 'chapter'
])

function cleanWord(text: string): string | null {
  if (!text) return null
  text = text.trim()
  if (/^\d+$/.test(text)) return null
  if (/[一-鿿]/.test(text)) return null
  if (/^[☐☑✓✗×■□●○◆◇★☆]+$/.test(text)) return null
  if (text.length < 2) return null
  if (/^[.,;:!?'"()\[\]{}\-/\\]+$/.test(text)) return null
  const cleaned = text.replace(/[^a-zA-Z''\-]/g, '')
  if (cleaned.length < 2) return null
  return cleaned.toLowerCase()
}

function isNoiseWord(word: string): boolean {
  const lower = word.toLowerCase()
  if (NOISE_WORDS.has(lower)) return true
  if (/^(adv|adj|vi|vt|n|vlink|prep|conj|pron|int|art)\.?$/i.test(lower)) return true
  if (word.length > 30) return true
  return false
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 使用 pdf2json 解析
    const lines = await new Promise<string[]>((resolve, reject) => {
      const pdfParser = new PDFParser()

      pdfParser.on('pdfParser_dataError', (errData: Error | { parserError: Error }) =>
        reject('parserError' in errData ? errData.parserError : errData)
      )

      pdfParser.on('pdfParser_dataReady', (pdfData: PdfData) => {
        const result: string[] = []

        pdfData.Pages.forEach((page: PdfPage) => {
          const rows: Record<number, PdfTextObj[]> = {}

          page.Texts.forEach((textObj: PdfTextObj) => {
            const y = Math.round(textObj.y * 100)
            if (!rows[y]) rows[y] = []
            rows[y].push(textObj)
          })

          const sortedY = Object.keys(rows).sort((a, b) => Number(a) - Number(b))

          sortedY.forEach(y => {
            const rowItems = rows[Number(y)].sort((a, b) => a.x - b.x)
            const rowText = rowItems
              .map((item) => decodeURIComponent(item.R[0].T))
              .join(' ')
              .trim()

            if (rowText) {
              result.push(rowText)
            }
          })
        })

        resolve(result)
      })

      pdfParser.parseBuffer(buffer)
    })

    // 从每行文本中提取单词
    const allWords: string[] = []
    for (const line of lines) {
      const tokens = line.split(/\s+/)
      for (const token of tokens) {
        const cleaned = cleanWord(token)
        if (cleaned && !isNoiseWord(cleaned)) {
          allWords.push(cleaned)
        }
      }
    }

    const words = [...new Set(allWords)]
    return NextResponse.json({ words })

  } catch (error) {
    console.error('PDF parsing error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to parse PDF' }, { status: 500 })
  }
}
