// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, BarChart2, Sparkles, Plus, ChevronRight } from 'lucide-react'

// Cores variadas para avatares — determinísticas pelo nome
const AVATAR_COLORS = [
  'bg-gradient-to-br from-rose-400 to-rose-600',
  'bg-gradient-to-br from-orange-400 to-orange-600',
  'bg-gradient-to-br from-amber-400 to-amber-600',
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
  'bg-gradient-to-br from-cyan-400 to-cyan-600',
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-violet-400 to-violet-600',
  'bg-gradient-to-br from-pink-400 to-pink-600',
]

function avatarColor(name: string): string {
  const code = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) ?? 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, niche, instagram_handle')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="page-container">

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-extrabold text-base text-surface-900">SocialMind</span>
          </div>
        </div>
        <p className="text-surface-400 text-sm mt-1">{greeting}! O que vamos criar hoje?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8 animate-slide-up">
        <div className="card p-4">
          <p className="text-3xl font-display font-extrabold text-orange-600 leading-none">
            {totalClients ?? 0}
          </p>
          <p className="text-xs text-surface-400 mt-1">Clientes ativos</p>
        </div>
        <Link href="/clients/new" className="card-hover p-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #fef3c7, #fed7aa)' }}
          >
            <Plus className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-display font-bold text-surface-900">Novo</p>
            <p className="text-xs text-surface-400">cliente</p>
          </div>
        </Link>
      </div>

      {/* Ações rápidas */}
      <div className="mb-6">
        <p className="font-display font-bold text-xs uppercase tracking-widest text-surface-400 mb-3">
          Ações rápidas
        </p>
        <div className="space-y-2">
          <Link href="/clients" className="card-hover p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-surface-900 text-sm">Clientes</p>
              <p className="text-xs text-surface-400">Gerenciar e criar conteúdo</p>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
          </Link>

          <Link href="/analytics" className="card-hover p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-surface-900 text-sm">Métricas</p>
              <p className="text-xs text-surface-400">Relatório mensal com IA</p>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* Clientes recentes */}
      {clients && clients.length > 0 && (
        <div>
          <p className="font-display font-bold text-xs uppercase tracking-widest text-surface-400 mb-3">
            Recentes
          </p>
          <div className="space-y-2">
            {clients.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="card-hover p-3.5 flex items-center gap-3"
              >
                <div className={`w-9 h-9 ${avatarColor(client.name)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-display font-extrabold text-sm">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-surface-900 text-sm truncate">{client.name}</p>
                  <p className="text-xs text-surface-400 truncate">{client.niche}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!clients || clients.length === 0) && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-amber-400" />
          </div>
          <p className="font-display font-semibold text-surface-900 mb-1">Nenhum cliente ainda</p>
          <p className="text-sm text-surface-400 mb-6">Cadastre o primeiro cliente para começar</p>
          <Link href="/clients/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Cadastrar primeiro cliente
          </Link>
        </div>
      )}

    </div>
  )
}
