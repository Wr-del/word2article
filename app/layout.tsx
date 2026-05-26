import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Word2Article - 英语单词转文章学习工具',
  description: '将单词变成文章，通过语境记忆单词',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-blue-600">
              Word2Article
            </a>
            <div className="space-x-4">
              <a href="/" className="text-gray-600 hover:text-blue-600">
                首页
              </a>
              <a href="/history" className="text-gray-600 hover:text-blue-600">
                历史
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
