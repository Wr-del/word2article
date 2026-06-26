export const STYLE_LABELS: Record<string, string> = {
  story: '故事',
  news: '新闻',
  science: '科普',
  dialogue: '对话',
}

export function speakWord(word: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }
}
