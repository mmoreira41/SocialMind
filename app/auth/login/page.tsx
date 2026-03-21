// app/auth/login/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Sparkles, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    if (!email || !password) {
      toast.error('Preencha email e senha')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email ou senha incorretos')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #1c1917 0%, #292524 55%, #3c1a0a 100%)' }}
    >
      <div className="w-full max-w-sm animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
            }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-extrabold" style={{ color: '#fef3c7' }}>
            SocialMind
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'rgba(254,243,199,0.5)' }}>
            Sua operação inteligente de social media
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="email"
                autoCapitalize="none"
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>
                : 'Entrar'
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
