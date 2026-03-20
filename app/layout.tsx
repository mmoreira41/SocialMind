import type { Metadata, Viewport } from 'next'
import { Sora, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SocialMind',
  description: 'Gestão inteligente de social media com IA',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#9333ea',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-surface-50 text-surface-900 antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
