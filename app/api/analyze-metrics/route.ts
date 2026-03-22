// app/api/analyze-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGeminiWithClient, parseGeminiJSON, GEMINI_TEXT } from '@/lib/gemini'

interface MetricsInput {
  reach: number | string
  impressions: number | string
  followers_gained: number | string
  profile_visits: number | string
  posts_count: number | string
  avg_likes: number | string
  avg_comments: number | string
  avg_saves: number | string
  avg_shares: number | string
  best_performing_posts?: string
  worst_performing_posts?: string
  extra_notes?: string
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { clientId, month, year, metrics }: {
      clientId: string
      month: number
      year: number
      metrics: MetricsInput
    } = await req.json()

    // Confirma que o cliente pertence ao usuário
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, niche')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    const fmt = (v: number | string) =>
      v ? Number(v).toLocaleString('pt-BR') : 'não informado'

    const userPrompt = `Analise as métricas de ${MONTHS_PT[month - 1]}/${year} e gere um relatório completo:

DADOS DO MÊS:
- Alcance total: ${fmt(metrics.reach)}
- Impressões totais: ${fmt(metrics.impressions)}
- Novos seguidores: ${fmt(metrics.followers_gained)}
- Visitas ao perfil: ${fmt(metrics.profile_visits)}
- Total de posts publicados: ${fmt(metrics.posts_count)}
- Média de curtidas por post: ${fmt(metrics.avg_likes)}
- Média de comentários por post: ${fmt(metrics.avg_comments)}
- Média de salvamentos por post: ${fmt(metrics.avg_saves)}
- Média de compartilhamentos por post: ${fmt(metrics.avg_shares)}
${metrics.best_performing_posts ? `- Posts que mais performaram: ${metrics.best_performing_posts}` : ''}
${metrics.worst_performing_posts ? `- Posts que menos performaram: ${metrics.worst_performing_posts}` : ''}
${metrics.extra_notes ? `- Observações adicionais: ${metrics.extra_notes}` : ''}

Retorne APENAS este JSON:
{
  "highlights": [
    "Destaque positivo 1 com número real (ex: O alcance cresceu X% em relação à média...)",
    "Destaque positivo 2",
    "Destaque positivo 3"
  ],
  "opportunities": [
    "O que não funcionou + hipótese estratégica do porquê",
    "Segunda oportunidade de melhoria com sugestão prática",
    "Terceira oportunidade"
  ],
  "patterns": [
    "Padrão identificado no comportamento da audiência com dado específico",
    "Segundo padrão (formatos, horários, temas que funcionam)",
    "Terceiro padrão"
  ],
  "recommendations": [
    "Ação específica 1 para o próximo mês (o quê + como + por quê)",
    "Ação específica 2",
    "Ação específica 3",
    "Ação específica 4",
    "Ação específica 5"
  ],
  "executive_summary": "3 parágrafos em linguagem acessível para o cliente final. Tom positivo mas honesto. Parágrafo 1: resultados do mês com números reais. Parágrafo 2: o que aprendemos sobre o público. Parágrafo 3: o que faremos diferente no próximo mês."
}

Regras:
- Baseie TODA análise no perfil e objetivos desta marca específica
- Nunca seja genérico — cada insight deve soar feito para esta marca
- Use números reais dos dados fornecidos
- executive_summary deve estar pronto para copiar e enviar ao cliente sem edição`

    const extraSystem = `Você também é analista de dados especializado em social media brasileiro.
Sua análise deve ser direta, prática e focada em ação.
O cliente final lê e impressiona sem confundir.`

    const raw = await callGeminiWithClient(clientId, userPrompt, extraSystem, GEMINI_TEXT)
    const analysis = parseGeminiJSON<{
      highlights: string[]
      opportunities: string[]
      patterns: string[]
      recommendations: string[]
      executive_summary: string
    }>(raw)

    // Salva no banco (upsert — sobrescreve se já existe para este mês)
    const { data: snapshot, error } = await supabase
      .from('analytics_snapshots')
      .upsert({
        client_id: clientId,
        month,
        year,
        raw_data: metrics,
        highlights: analysis.highlights,
        opportunities: analysis.opportunities,
        patterns: analysis.patterns,
        recommendations: analysis.recommendations,
        executive_summary: analysis.executive_summary,
        captured_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, snapshot })

  } catch (err) {
    console.error('analyze-metrics error:', err)
    return NextResponse.json({ error: 'Erro ao analisar métricas' }, { status: 500 })
  }
}
