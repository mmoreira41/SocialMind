// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// ─── Clientes da API ──────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const GEMINI_TEXT  = process.env.GEMINI_MODEL_TEXT  || 'gemini-2.5-pro'
export const GEMINI_FAST  = process.env.GEMINI_MODEL_FAST  || 'gemini-2.0-flash'
export const GEMINI_IMAGE = process.env.GEMINI_MODEL_IMAGE || 'gemini-2.0-flash-exp'

// ─── Contexto de cliente ──────────────────────────────────────
export async function getClientContext(clientId: string): Promise<string> {
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*, client_profiles(*)')
    .eq('id', clientId)
    .single()

  if (!client) throw new Error('Cliente não encontrado')

  const profile = client.client_profiles?.[0] ?? null

  if (!profile) {
    return `
Você é um estrategista de conteúdo especializado nesta marca:
MARCA: ${client.name}
NICHO: ${client.niche}
Instagram: ${client.instagram_handle ?? 'não informado'}

O perfil completo ainda não foi gerado. Use o nicho como referência principal.
Escreva sempre em português brasileiro natural e fluido.
    `.trim()
  }

  return `
Você é um estrategista de conteúdo especializado nesta marca.
Você conhece essa marca profundamente — responda sempre com esse nível de contexto.

═══════════════════════════════════════════════
MARCA: ${client.name}
NICHO: ${client.niche}
Instagram: ${client.instagram_handle ?? 'não informado'}
═══════════════════════════════════════════════

PERSONA DO PÚBLICO:
${JSON.stringify(profile.persona, null, 2)}

PILARES DE CONTEÚDO:
${Array.isArray(profile.pillars)
  ? profile.pillars.map((p: { name: string; description: string }, i: number) => `${i + 1}. ${p.name}: ${p.description}`).join('\n')
  : profile.pillars}

TOM DE VOZ:
${profile.tone_guidelines}

OPORTUNIDADES DE CONTEÚDO:
${profile.content_opportunities}

ANÁLISE DAS REFERÊNCIAS:
${profile.references_analysis}
═══════════════════════════════════════════════

REGRAS ABSOLUTAS:
- Nunca seja genérico. Cada resposta deve soar feita exclusivamente para esta marca.
- Escreva sempre em português brasileiro natural e fluido.
- Respeite rigorosamente o tom de voz documentado acima.
- Retorne sempre JSON válido quando solicitado — sem markdown, sem texto extra.
  `.trim()
}

// ─── Chamada simples ──────────────────────────────────────────
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  model = GEMINI_TEXT
): Promise<string> {
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
  })

  const result = await geminiModel.generateContent(userPrompt)
  return result.response.text()
}

// ─── Chamada com contexto de cliente ─────────────────────────
export async function callGeminiWithClient(
  clientId: string,
  userPrompt: string,
  extraSystem = '',
  model = GEMINI_TEXT
): Promise<string> {
  const clientContext = await getClientContext(clientId)
  const systemPrompt = extraSystem
    ? `${clientContext}\n\n${extraSystem}`
    : clientContext

  return callGemini(systemPrompt, userPrompt, model)
}

// ─── Parse seguro de JSON da resposta ────────────────────────
export function parseGeminiJSON<T>(text: string): T {
  const clean = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  return JSON.parse(clean) as T
}
