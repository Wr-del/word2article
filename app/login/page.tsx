'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '发送失败')
        return
      }

      setCodeSent(true)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setError('发送失败，请稍后重试')
    } finally {
      setSending(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !code) {
      setError('请输入邮箱和验证码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        code,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md w-full mx-auto p-4 space-y-6 relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
          欢迎使用 Word2Article
        </h1>
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
          登录后即可保存你的学习记录
        </p>
      </div>

      <div className="glass-card rounded-2xl custom-shadow p-6 w-full space-y-5">
        {/* 邮箱验证码登录 */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold" style={{ color: 'var(--fg-muted)' }}>邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--fg)',
                border: '1px solid var(--input-border)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-500)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--input-border)'; }}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-semibold" style={{ color: 'var(--fg-muted)' }}>验证码</label>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                placeholder="6 位数字"
                maxLength={6}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all"
                style={{
                  background: 'var(--input-bg)',
                  color: 'var(--fg)',
                  border: '1px solid var(--input-border)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-500)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--input-border)'; }}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sending || countdown > 0}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all disabled:opacity-50"
                style={{ background: 'var(--highlight-bg)', color: 'var(--brand-500)' }}
              >
                {sending ? '发送中...' : countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '获取验证码'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !code}
            className="w-full py-3 font-bold text-sm rounded-xl transition-all disabled:opacity-40"
            style={{ background: 'var(--brand-500)', color: '#ffffff' }}
          >
            {loading ? '登录中...' : '登录 / 注册'}
          </button>
        </form>

        {/* 分割线 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
          <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>或</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
        </div>

        {/* 第三方登录 */}
        <div className="space-y-2.5">
          <button
            onClick={() => signIn('github', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all"
            style={{ background: '#24292e', color: '#ffffff' }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            使用 GitHub 登录
          </button>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all"
            style={{ background: 'var(--bg-secondary)', color: 'var(--fg)', border: '1px solid var(--border)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            使用 Google 登录
          </button>
        </div>
      </div>

      <p className="text-[10px] text-center" style={{ color: 'var(--fg-muted)' }}>
        登录即代表同意我们的服务条款和隐私政策
      </p>
    </main>
  )
}
