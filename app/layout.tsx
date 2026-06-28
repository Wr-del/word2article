import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Providers from '@/components/Providers'
import BottomNav from '@/components/BottomNav'
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
    { media: '(prefers-color-scheme: light)', color: '#faf8ff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
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
          <div className="absolute top-[10%] left-[8%] w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-purple-500 blur-[100px] animate-fluid-1" style={{ opacity: 'var(--particle-opacity-1)' }}></div>
          <div className="absolute bottom-[20%] right-[8%] w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full bg-indigo-500 blur-[120px] animate-fluid-2" style={{ opacity: 'var(--particle-opacity-2)' }}></div>
          <div className="absolute top-[35%] left-[25%] w-[350px] h-[350px] md:w-[420px] md:h-[420px] rounded-full bg-violet-500 blur-[130px] animate-fluid-3" style={{ opacity: 'var(--particle-opacity-3)' }}></div>
        </div>

        {/* 顶部品牌栏 */}
        <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto px-4 h-12 flex items-center">
            <Link href="/" className="flex items-center gap-2 cursor-pointer group">
              <div className="p-1 rounded-md" style={{ color: 'var(--brand-500)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--fg)' }}>
                Word2Article
              </span>
            </Link>
          </div>
        </header>

        {/* 主内容区，底部留出 Tab 空间 */}
        <div className="flex-1 pb-16">
          {children}
        </div>

        {/* 底部 Tab 导航 */}
        <BottomNav />

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
