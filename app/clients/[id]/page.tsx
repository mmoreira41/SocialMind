// app/clients/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { FileText, BarChart2, CalendarDays, MessageCircle, ChevronRight, Instagram, Sparkles } from 'lucide-react'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*, client_profiles(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!client) notFound()

  const profile = client.client_profiles?.[0] ?? null

  return (
    <div className="page-container">
      <Header title={client.name} subtitle={client.niche} showBack />

      {/* Info rápida */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-2xl">{client.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-surface-900 truncate">{client.name}</p>
          <p className="text-sm text-surface-500">{client.niche}</p>
          {client.instagram_handle && (
            <div className="flex items-center gap-1 mt-0.5">
              <Instagram className="w-3 h-3 text-pink-500" />
              <span className="text-xs text-pink-500">@{client.instagram_handle}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="space-y-2 mb-8">
        <Link href={`/clients/${id}/plan`} className="card-hover p-4 flex items-center gap-4">
          <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-surface-900 text-sm">Pauta mensal</p>
            <p className="text-xs text-surface-500">Gerar 28 ideias de posts</p>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-300" />
        </Link>

        <Link href={`/analytics?client=${id}`} className="card-hover p-4 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-surface-900 text-sm">Métricas</p>
            <p className="text-xs text-surface-500">Analisar resultados do mês</p>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-300" />
        </Link>

        <Link href={`/clients/${id}/replies`} className="card-hover p-4 flex items-center gap-4">
          <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-surface-900 text-sm">Respostas</p>
            <p className="text-xs text-surface-500">Sugestões para comentários e DMs</p>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-300" />
        </Link>
      </div>

      {/* Documento de posicionamento */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-surface-400" />
          <h2 className="font-display font-semibold text-surface-900 text-sm">Posicionamento</h2>
        </div>

        {profile ? (
          <div className="space-y-3">

            {/* Persona */}
            <div className="card p-4">
              <p className="font-semibold text-surface-900 text-sm mb-2">👤 Persona</p>
              <p className="text-sm text-surface-600 mb-2">{profile.persona?.demographics}</p>
              {Array.isArray(profile.persona?.pain_points) && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 mb-1">Dores principais</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.persona.pain_points.slice(0, 3).map((p: string, i: number) => (
                      <span key={i} className="badge bg-red-50 text-red-600 text-xs">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pilares */}
            {Array.isArray(profile.pillars) && profile.pillars.length > 0 && (
              <div className="card p-4">
                <p className="font-semibold text-surface-900 text-sm mb-3">🏛️ Pilares de conteúdo</p>
                <div className="space-y-2">
                  {profile.pillars.map((pillar: { name: string; description: string }, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-surface-800">{pillar.name}</p>
                        <p className="text-xs text-surface-500">{pillar.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tom de voz */}
            {profile.tone_guidelines && (
              <div className="card p-4">
                <p className="font-semibold text-surface-900 text-sm mb-2">🎙️ Tom de voz</p>
                <p className="text-sm text-surface-600 whitespace-pre-line leading-relaxed">
                  {profile.tone_guidelines.slice(0, 400)}{profile.tone_guidelines.length > 400 ? '...' : ''}
                </p>
              </div>
            )}

          </div>
        ) : (
          <div className="card p-6 text-center">
            <Sparkles className="w-8 h-8 text-brand-300 mx-auto mb-2" />
            <p className="text-sm text-surface-500">Perfil ainda sendo gerado...</p>
          </div>
        )}
      </div>
    </div>
  )
}
