'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, BarChart2 } from 'lucide-react'

const nav = [
  { href: '/dashboard', icon: Home, label: 'Início' },
  { href: '/clients', icon: Users, label: 'Clientes' },
  { href: '/analytics', icon: BarChart2, label: 'Métricas' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-100 z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 px-6 min-w-0 transition-colors ${
                active ? 'text-brand-600' : 'text-surface-400 hover:text-surface-600'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
