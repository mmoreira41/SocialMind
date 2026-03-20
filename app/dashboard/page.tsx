// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, BarChart2, Sparkles, Plus, ChevronRight } from 'lucide-react'

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

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="page-container">

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-surface-900">SocialMind</span>
        </div>
        <p className="text-surface-500 text-sm">{greeting}! O que vamos criar hoje?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8 animate-slide-up">
        <div className="card p-4">
          <p className="text-3xl font-display font-bold text-brand-600">{totalClients ?? 0}</p>
          <p className="text-xs text-surface-500 mt-0.5">Clientes ativos</p>
        </div>
        <Link href="/clients/new" className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800">Novo</p>
            <p className="text-xs text-surface-500">cliente</p>
          </div>
        </Link>
      </div>

      {/* Ações rápidas */}
      <div className="mb-6">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-surface-400 mb-3">Ações rápidas</h2>
        <div className="space-y-2">
          <Link href="/clients" className="card-hover p-4 flex items-center gap-4">
            <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-surface-900 text-sm">Clientes</p>
              <p className="text-xs text-surface-500">Gerenciar e criar conteúdo</p>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
          </Link>

          <Link href="/analytics" className="card-hover p-4 flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-surface-900 text-sm">Métricas</p>
              <p className="text-xs text-surface-500">Relatório mensal com IA</p>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* Clientes recentes */}
      {clients && clients.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-surface-400 mb-3">Recentes</h2>
          <div className="space-y-2">
            {clients.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="card-hover p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 text-sm truncate">{client.name}</p>
                  <p className="text-xs text-surface-500 truncate">{client.niche}</p>
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
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-brand-400" />
          </div>
          <p className="font-semibold text-surface-900 mb-1">Nenhum cliente ainda</p>
          <p className="text-sm text-surface-500 mb-6">Cadastre o primeiro cliente para começar</p>
          <Link href="/clients/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Cadastrar primeiro cliente
          </Link>
        </div>
      )}

    </div>
  )
}
