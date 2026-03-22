// app/api/get-analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // Com month + year: retorna snapshot específico (usado pelo AnalyticsView ao trocar cliente/mês)
    if (month && year) {
      const { data: snapshot } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('client_id', clientId)
        .eq('month', parseInt(month))
        .eq('year', parseInt(year))
        .maybeSingle()

      return NextResponse.json({ success: true, snapshot: snapshot ?? null })
    }

    // Sem month/year: retorna histórico completo dos últimos 12 meses
    const { data: snapshots } = await supabase
      .from('analytics_snapshots')
      .select('id, month, year, highlights, executive_summary, captured_at')
      .eq('client_id', clientId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(12)

    return NextResponse.json({ success: true, snapshots: snapshots ?? [] })

  } catch (err) {
    console.error('get-analytics error:', err)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
