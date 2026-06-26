import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
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
      <body className={`${inter.className} bg-[#03060c] text-slate-200 min-h-screen flex flex-col antialiased selection:bg-brand-500/20 selection:text-brand-500 relative overflow-x-hidden`}>

        {/* 微米级哑光噪点材质层 */}
        <svg className="fixed inset-0 w-full h-full -z-20 pointer-events-none opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
          <filter id="matte-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.08 0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#matte-noise)"/>
        </svg>

        {/* 液态流动粒子层 */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[8%] w-[350px] md:w-[450px] h-[350px] md:h-[450px] rounded-full bg-emerald-500/8 blur-[100px] animate-fluid-1"></div>
          <div className="absolute bottom-[20%] right-[8%] w-[400px] md:w-[500px] h-[400px] md:h-[500px] rounded-full bg-blue-500/6 blur-[120px] animate-fluid-2"></div>
          <div className="absolute top-[35%] left-[25%] w-[420px] h-[420px] rounded-full bg-purple-500/3 blur-[130px] animate-fluid-3"></div>
        </div>

        {/* 顶部半透明磨砂导航栏 */}
        <header className="bg-[#03060c]/70 border-b border-slate-900/40 sticky top-0 z-40 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
              <div className="p-2 bg-brand-500/10 text-brand-500 rounded-xl shadow-inner border border-brand-500/5 group-hover:bg-brand-500/20 group-hover:scale-105 transition-all duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-base text-slate-100 tracking-tight transition-colors duration-300 group-hover:text-brand-500">Word2Article</span>
            </Link>
            <nav className="flex items-center gap-5">
              <Link href="/" className="text-xs font-semibold text-brand-500 transition-colors">
                首页
              </Link>
              <Link href="/favorites" className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5">
                生词本
              </Link>
              <Link href="/history" className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5">
                历史记录
              </Link>
            </nav>
          </div>
        </header>

        {children}

        {/* 页脚 */}
        <footer className="py-6 text-center text-[10px] text-slate-700 border-t border-slate-900/40 mt-auto relative z-10">
          <p>© 2026 Word2Article. 融入语境，高效记单词</p>
        </footer>

        {/* 随动光影效果脚本 */}
        <script dangerouslySetInnerHTML={{
          __html: `
            function initSpotlightEngine() {
              const updateGlow = (e) => {
                document.querySelectorAll('.glass-card').forEach(card => {
                  const rect = card.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  card.style.setProperty('--mouse-x', x + 'px');
                  card.style.setProperty('--mouse-y', y + 'px');
                });
              };
              window.addEventListener('mousemove', updateGlow);
            }
            document.addEventListener('DOMContentLoaded', initSpotlightEngine);
          `
        }} />
      </body>
    </html>
  )
}
