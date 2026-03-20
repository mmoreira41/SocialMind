import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, parseGeminiJSON, GEMINI_TEXT } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { briefing, clientId } = await req.json()

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    const systemPrompt = `Você é um estrategista de marca sênior com 15 anos de experiência em marketing digital brasileiro.
Você cria documentos de posicionamento ricos, práticos e acionáveis.
Conhece profundamente o mercado brasileiro, cultura digital e o posicionamento de cada nicho.
Retorne APENAS JSON válido, sem texto adicional, sem markdown, sem backticks.`

    const userPrompt = `Com base neste briefing, gere o documento de posicionamento completo para a marca "${client.name}" no nicho "${client.niche}":

BRIEFING:
${briefing}

Retorne um JSON com exatamente esta estrutura:
{
  "persona": {
    "demographics": "descrição detalhada: idade, localização, renda, estilo de vida",
    "psychographics": "valores, crenças, comportamentos, aspirações",
    "pain_points": ["dor 1", "dor 2", "dor 3", "dor 4"],
    "desires": ["desejo 1", "desejo 2", "desejo 3", "desejo 4"],
    "language_they_use": ["expressão 1", "expressão 2", "gíria 3", "termo 4", "expressão 5"]
  },
  "pillars": [
    {
      "name": "Nome do Pilar",
      "description": "O que representa e por que é importante para a marca",
      "examples": ["exemplo de post 1", "exemplo de post 2", "exemplo de post 3"]
    }
  ],
  "tone_guidelines": "Guia completo com 12+ diretrizes específicas: como falar, como não falar, palavras que usar, palavras que evitar, nível de formalidade, uso de humor, como tratar o público, emojis (sim/não/quais), etc.",
  "content_opportunities": "Análise de tendências, formatos e oportunidades que funcionam bem para este nicho no Brasil hoje. Específico e prático.",
  "references_analysis": "O que aprender das marcas referência citadas: o que fazem bem e pode ser adaptado"
}

Gere exatamente 5 pilares. Seja específico, rico em detalhes e 100% adaptado à realidade brasileira.`

    const raw = await callGemini(systemPrompt, userPrompt, GEMINI_TEXT)
    const profile = parseGeminiJSON<Record<string, unknown>>(raw)

    const { error } = await supabase
      .from('client_profiles')
      .upsert({
        client_id: clientId,
        ...profile,
        raw_briefing: briefing,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return NextResponse.json({ success: true, profile })

  } catch (err) {
    console.error('generate-profile error:', err)
    return NextResponse.json({ error: 'Erro ao gerar perfil' }, { status: 500 })
  }
}
