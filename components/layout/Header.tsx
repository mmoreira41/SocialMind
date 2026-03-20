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
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-100 active:bg-surface-200 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-surface-600" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-display font-bold text-xl text-surface-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-surface-500 truncate">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  )
}
