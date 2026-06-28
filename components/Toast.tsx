'use client'

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react'

interface ToastState {
  message: string
  type: 'error' | 'success'
  id: number
}

const ToastContext = createContext<(message: string, type?: 'error' | 'success') => void>(() => {})

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)

  const show = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type, id: ++toastId })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext value={show}>
      {children}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] island-toast">
          <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold border shadow-lg backdrop-blur-xl ${
            toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
