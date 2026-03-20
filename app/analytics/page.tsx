// app/analytics/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import { BarChart2 } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="page-container">
      <Header title="Métricas" />
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="font-semibold text-surface-900 mb-1">Em breve</p>
        <p className="text-sm text-surface-500">Análise de métricas com IA — Semana 3</p>
      </div>
    </div>
  )
}
