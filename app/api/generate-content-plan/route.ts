// app/api/generate-content-plan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGeminiWithClient, parseGeminiJSON, GEMINI_TEXT } from '@/lib/gemini'
import { ContentIdea } from '@/types'
import { MONTHS_PT } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { clientId, month, year, monthContext } = await req.json()

    // Verifica se já existe pauta para este mês
    const { data: existing } = await supabase
      .from('content_plans')
      .select('id')
      .eq('client_id', clientId)
      .eq('month', month)
      .eq('year', year)
      .single()

    const upsertData = {
      client_id: clientId,
      month,
      year,
      status: 'generating',
      generated_ideas: [],
      approved_ideas: [],
      month_context: monthContext || '',
    }

    const { data: plan, error: upsertError } = existing
      ? await supabase.from('content_plans').update(upsertData).eq('id', existing.id).select().single()
      : await supabase.from('content_plans').insert(upsertData).select().single()

    if (upsertError) throw upsertError

    const userPrompt = `Gere a pauta de conteúdo para ${MONTHS_PT[month - 1]} de ${year}.

CONTEXTO DO MÊS:
${monthContext || 'Nenhum contexto especial informado.'}

Crie exatamente 28 ideias de posts distribuídas em 4 semanas (7 por semana).

Para cada ideia retorne:
{
  "id": "idea-N",
  "week": 1,
  "title": "Título claro e específico da ideia",
  "objective": "engajamento",
  "format": "reels",
  "platform": "instagram",
  "hook": "Primeira frase/cena que vai parar o scroll",
  "why_it_works": "Por que essa ideia funciona ESPECIFICAMENTE para essa marca",
  "status": "draft"
}

Valores válidos:
- objective: "engajamento" | "conversão" | "autoridade" | "humanização" | "alcance"
- format: "reels" | "carrossel" | "estático" | "stories"
- platform: "instagram" | "tiktok" | "linkedin" | "todos"

Distribua equilibradamente:
- 8 engajamento, 4 conversão, 6 autoridade, 6 humanização, 4 alcance
- 8 reels, 8 carrosséis, 6 estáticos, 6 stories

Retorne APENAS JSON válido: { "ideas": [...] }`

    const raw = await callGeminiWithClient(clientId, userPrompt, '', GEMINI_TEXT)
    const { ideas } = parseGeminiJSON<{ ideas: ContentIdea[] }>(raw)

    const ideasWithIds = ideas.map((idea, i) => ({
      ...idea,
      id: `idea-${Date.now()}-${i}`,
      status: 'draft' as const,
    }))

    await supabase
      .from('content_plans')
      .update({ generated_ideas: ideasWithIds, status: 'ready' })
      .eq('id', plan.id)

    return NextResponse.json({ success: true, planId: plan.id, ideas: ideasWithIds })

  } catch (err) {
    console.error('generate-content-plan error:', err)
    return NextResponse.json({ error: 'Erro ao gerar pauta' }, { status: 500 })
  }
}
