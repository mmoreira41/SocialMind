'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  showBack?: boolean
}

export default function Header({ title, subtitle, action, showBack }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="flex items-center gap-3 mb-6">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-100 bg-white hover:bg-surface-50 active:bg-surface-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-surface-500" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-display font-extrabold text-xl text-surface-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-surface-400 truncate mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  )
}
