// app/api/generate-post/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGeminiWithClient, parseGeminiJSON, GEMINI_FAST } from '@/lib/gemini'
import { ContentIdea } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { clientId, contentPlanId, idea }: {
      clientId: string
      contentPlanId: string
      idea: ContentIdea
    } = await req.json()

    const userPrompt = `Gere o conteúdo completo para este post:

IDEIA: ${idea.title}
FORMATO: ${idea.format}
OBJETIVO: ${idea.objective}
PLATAFORMA: ${idea.platform}
HOOK SUGERIDO: ${idea.hook}

Retorne APENAS este JSON:
{
  "caption_draft": "Legenda completa pronta para publicar. Hook forte na 1ª linha, desenvolvimento no meio, CTA claro no final. Instagram: 150-250 palavras, emojis estratégicos, quebras de linha naturais.",
  "hashtags": ["hashtag1", "hashtag2"],
  "stories_version": "Versão para stories em 3 slides. Separe com ---. Máx 2-3 linhas por slide.",
  "visual_brief": "Briefing detalhado: cores, estilo visual, texto na arte, proporção (1:1, 9:16, 16:9), elementos visuais, mood geral.",
  "caption_variations": [
    "Variação mais curta e direta (máx 80 palavras)",
    "Variação com ângulo ou hook diferente"
  ]
}

Regras:
- Até 15 hashtags sem o #
- Tudo em português brasileiro natural
- Nada pode soar genérico — escreva como especialista desta marca`

    const raw = await callGeminiWithClient(clientId, userPrompt, '', GEMINI_FAST)
    const postContent = parseGeminiJSON<Record<string, unknown>>(raw)

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        content_plan_id: contentPlanId,
        client_id: clientId,
        idea,
        ...postContent,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, post })

  } catch (err) {
    console.error('generate-post error:', err)
    return NextResponse.json({ error: 'Erro ao gerar post' }, { status: 500 })
  }
}
