// app/clients/[id]/plan/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import PlanView from '@/components/content/PlanView'

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, niche')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!client) notFound()

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { data: plan } = await supabase
    .from('content_plans')
    .select('*')
    .eq('client_id', id)
    .eq('month', month)
    .eq('year', year)
    .single()

  return (
    <div className="page-container">
      <Header title="Pauta mensal" subtitle={client.name} showBack />
      <PlanView
        client={client}
        initialPlan={plan ?? null}
        month={month}
        year={year}
      />
    </div>
  )
}
