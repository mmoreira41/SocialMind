// app/api/update-plan-approvals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { planId, approvedIdeas } = await req.json()

    const { error } = await supabase
      .from('content_plans')
      .update({ approved_ideas: approvedIdeas, status: 'active' })
      .eq('id', planId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('update-plan-approvals error:', err)
    return NextResponse.json({ error: 'Erro ao salvar aprovações' }, { status: 500 })
  }
}
