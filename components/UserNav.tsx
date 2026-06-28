'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export default function UserNav() {
  const { data: session, status } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  if (status === 'loading') {
    return (
      <div className="w-7 h-7 rounded-full animate-pulse" style={{ background: 'var(--input-bg)' }}></div>
    )
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
        style={{ background: 'var(--highlight-bg)', color: 'var(--brand-500)' }}
      >
        登录
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || '用户'}
            className="w-7 h-7 rounded-full border-2"
            style={{ borderColor: 'var(--brand-500)' }}
          />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--brand-500)', color: '#ffffff' }}>
            {session.user?.name?.[0] || 'U'}
          </div>
        )}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
          <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border shadow-lg overflow-hidden" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--fg)' }}>{session.user?.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--fg-muted)' }}>{session.user?.email}</p>
            </div>
            <button
              onClick={() => { signOut(); setShowMenu(false); }}
              className="w-full px-4 py-2.5 text-xs font-medium text-left transition-colors"
              style={{ color: 'var(--fg-secondary)' }}
            >
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  )
}
