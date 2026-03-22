// app/analytics/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import AnalyticsView from '@/components/content/AnalyticsView'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const selectedClientId = params.client ?? null

  // Busca todos os clientes para o seletor
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, niche')
    .eq('user_id', user.id)
    .order('name')

  // Se tem cliente selecionado, busca o snapshot mais recente
  let initialSnapshot = null
  if (selectedClientId) {
    const { data } = await supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('client_id', selectedClientId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .single()
    initialSnapshot = data ?? null
  }

  return (
    <div className="page-container">
      <Header title="Métricas" />
      <AnalyticsView
        clients={clients ?? []}
        selectedClientId={selectedClientId}
        initialSnapshot={initialSnapshot}
      />
    </div>
  )
}
