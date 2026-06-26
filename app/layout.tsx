import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Providers from '@/components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Word2Article - 英语单词转文章学习工具',
  description: '将单词变成文章，通过语境记忆单词',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Word2Article',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#03060c' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen flex flex-col antialiased relative overflow-x-hidden`}
        style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <Providers>

        {/* 噪点纹理 */}
        <svg className="fixed inset-0 w-full h-full -z-20 pointer-events-none" style={{ opacity: 'var(--noise-opacity)' }} xmlns="http://www.w3.org/2000/svg">
          <filter id="matte-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.08 0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#matte-noise)"/>
        </svg>

        {/* 背景粒子 */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[8%] w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-emerald-500 blur-[100px] animate-fluid-1" style={{ opacity: 'var(--particle-opacity-1)' }}></div>
          <div className="absolute bottom-[20%] right-[8%] w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full bg-blue-500 blur-[120px] animate-fluid-2" style={{ opacity: 'var(--particle-opacity-2)' }}></div>
          <div className="absolute top-[35%] left-[25%] w-[350px] h-[350px] md:w-[420px] md:h-[420px] rounded-full bg-purple-500 blur-[130px] animate-fluid-3" style={{ opacity: 'var(--particle-opacity-3)' }}></div>
        </div>

        {/* 导航栏 */}
        <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer group">
              <div className="p-1.5 rounded-lg transition-all duration-200 group-hover:scale-105"
                style={{ background: 'var(--highlight-bg)', color: 'var(--brand-500)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-sm tracking-tight transition-colors" style={{ color: 'var(--fg)' }}>
                Word2Article
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-xs font-semibold transition-colors" style={{ color: 'var(--brand-500)' }}>
                首页
              </Link>
              <Link href="/favorites" className="text-xs font-medium transition-colors" style={{ color: 'var(--fg-secondary)' }}>
                生词本
              </Link>
              <Link href="/history" className="text-xs font-medium transition-colors" style={{ color: 'var(--fg-secondary)' }}>
                历史记录
              </Link>
            </nav>
          </div>
        </header>

        {children}

        {/* 页脚 */}
        <footer className="py-5 text-center text-[10px] mt-auto relative z-10" style={{ color: 'var(--footer-text)', borderTop: '1px solid var(--footer-border)' }}>
          <p>© 2026 Word2Article. 融入语境，高效记单词</p>
        </footer>

        {/* 鼠标追光 */}
        <script dangerouslySetInnerHTML={{
          __html: `
            function initSpotlightEngine() {
              const updateGlow = (e) => {
                document.querySelectorAll('.glass-card').forEach(card => {
                  const rect = card.getBoundingClientRect();
                  card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
                  card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
                });
              };
              window.addEventListener('mousemove', updateGlow);
            }
            document.addEventListener('DOMContentLoaded', initSpotlightEngine);
          `
        }} />
      </Providers>
      </body>
    </html>
  )
}
