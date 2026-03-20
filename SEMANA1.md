# SEMANA1.md — Fundação + Onboarding de Cliente
> Execute este arquivo no Claude Code. Ele é autônomo — leia do início ao fim antes de começar.

## Contexto
Estamos construindo o SocialMind, sistema de gestão de social media com IA. O repositório base já existe com estrutura de pastas, tipos, schema SQL e rotas de API scaffolded. Este módulo constrói tudo que está faltando para a Semana 1 funcionar do início ao fim.

**Leia o CLAUDE.md antes de qualquer ação.**

---

## O que será construído neste módulo

1. `lib/gemini.ts` — helper completo com contexto de cliente (substitui o lib/claude.ts)
2. Tela de login funcional com Supabase Auth
3. Dashboard com stats reais e ações rápidas
4. Lista de clientes com busca
5. Formulário de cadastro em 3 etapas (mobile-first)
6. Integração com `/api/generate-profile` usando Gemini
7. Página do cliente com documento de posicionamento exibido
8. Ajustes no layout e BottomNav

**Critério de conclusão:** ela cadastra um cliente real, o sistema chama a API do Gemini e retorna um documento de posicionamento que faz sentido.

---

## Etapa 1 — Atualizar package.json e instalar dependências

Substituir o arquivo `package.json` existente:

```json
{
  "name": "socialmind",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@google/generative-ai": "^0.21.0",
    "@supabase/supabase-js": "^2.47.10",
    "@supabase/ssr": "^0.5.2",
    "@tiptap/react": "^2.11.0",
    "@tiptap/starter-kit": "^2.11.0",
    "@tiptap/extension-placeholder": "^2.11.0",
    "lucide-react": "^0.469.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "sonner": "^1.7.1",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "15.1.0"
  }
}
```

Rodar no terminal:
```bash
npm install
```

---

## Etapa 2 — Criar lib/gemini.ts

Criar o arquivo `lib/gemini.ts` — este é o coração do sistema. **Substitui completamente o lib/claude.ts existente.**

```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// ─── Clientes da API ──────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const GEMINI_TEXT    = process.env.GEMINI_MODEL_TEXT  || 'gemini-2.5-pro'
export const GEMINI_FAST    = process.env.GEMINI_MODEL_FAST  || 'gemini-2.0-flash'
export const GEMINI_IMAGE   = process.env.GEMINI_MODEL_IMAGE || 'gemini-2.0-flash-exp'

// ─── Contexto de cliente ──────────────────────────────────────
// Monta o system prompt com o perfil completo do cliente
// Injetado em TODA chamada de IA — nunca responde genérico
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
INSTAGRAM: ${client.instagram_handle ?? 'não informado'}
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

// ─── Chamada simples (sem contexto de cliente) ────────────────
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
```

---

## Etapa 3 — Atualizar /api/generate-profile/route.ts

Substituir o conteúdo de `app/api/generate-profile/route.ts`:

```typescript
// app/api/generate-profile/route.ts
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
Conhece profundamente o mercado brasileiro, cultura digital e comportamento de cada nicho.
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
```

---

## Etapa 4 — Tela de login

Substituir `app/auth/login/page.tsx`:

```tsx
// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Sparkles, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    if (!email || !password) {
      toast.error('Preencha email e senha')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email ou senha incorretos')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-5 ring-1 ring-white/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">SocialMind</h1>
          <p className="text-white/60 text-sm mt-2">Sua operação inteligente de social media</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-brand-950/50">
          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="email"
                autoCapitalize="none"
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>
                : 'Entrar'
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
```

---

## Etapa 5 — Dashboard page

Substituir `app/dashboard/page.tsx`:

```tsx
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, BarChart2, Sparkles, Plus, ChevronRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, niche, instagram_handle')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="page-container">

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-surface-900">SocialMind</span>
        </div>
        <p className="text-surface-500 text-sm">{greeting}! O que vamos criar hoje?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8 animate-slide-up">
        <div className="card p-4">
          <p className="text-3xl font-display font-bold text-brand-600">{totalClients ?? 0}</p>
          <p className="text-xs text-surface-500 mt-0.5">Clientes ativos</p>
        </div>
        <Link href="/clients/new" className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800">Novo</p>
            <p className="text-xs text-surface-500">cliente</p>
          </div>
        </Link>
      </div>

      {/* Ações rápidas */}
      <div className="mb-8">
        <h2 className="font-display font-semibold text-surface-900 mb-3 text-sm uppercase tracking-wide text-surface-400">Ações rápidas</h2>
        <div className="space-y-2">
          <Link href="/clients" className="card-hover p-4 flex items-center gap-4">
            <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-surface-900 text-sm">Clientes</p>
              <p className="text-xs text-surface-500">Gerenciar e criar conteúdo</p>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
          </Link>

          <Link href="/analytics" className="card-hover p-4 flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-surface-900 text-sm">Métricas</p>
              <p className="text-xs text-surface-500">Relatório mensal com IA</p>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* Clientes recentes */}
      {clients && clients.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-surface-400 mb-3">Recentes</h2>
          <div className="space-y-2">
            {clients.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="card-hover p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 text-sm truncate">{client.name}</p>
                  <p className="text-xs text-surface-500 truncate">{client.niche}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!clients || clients.length === 0) && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-brand-400" />
          </div>
          <p className="font-semibold text-surface-900 mb-1">Nenhum cliente ainda</p>
          <p className="text-sm text-surface-500 mb-6">Cadastre o primeiro cliente para começar</p>
          <Link href="/clients/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Cadastrar primeiro cliente
          </Link>
        </div>
      )}

    </div>
  )
}
```

---

## Etapa 6 — Lista de clientes

Criar `app/clients/page.tsx`:

```tsx
// app/clients/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { Plus, ChevronRight, Search } from 'lucide-react'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const query = params.q?.toLowerCase() ?? ''

  let dbQuery = supabase
    .from('clients')
    .select('id, name, niche, instagram_handle, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,niche.ilike.%${query}%`)
  }

  const { data: clients } = await dbQuery

  return (
    <div className="page-container">
      <Header
        title="Clientes"
        action={
          <Link href="/clients/new" className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4">
            <Plus className="w-4 h-4" />
            Novo
          </Link>
        }
      />

      {/* Busca */}
      <form className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Buscar por nome ou nicho..."
            className="input pl-10"
            autoComplete="off"
          />
        </div>
      </form>

      {/* Lista */}
      {clients && clients.length > 0 ? (
        <div className="space-y-2">
          {clients.map(client => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="card-hover p-4 flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-surface-900 truncate">{client.name}</p>
                <p className="text-sm text-surface-500 truncate">{client.niche}</p>
                {client.instagram_handle && (
                  <p className="text-xs text-brand-500 truncate">@{client.instagram_handle}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-surface-500 text-sm">
            {query ? `Nenhum cliente encontrado para "${query}"` : 'Nenhum cliente cadastrado'}
          </p>
          {!query && (
            <Link href="/clients/new" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus className="w-4 h-4" />
              Cadastrar primeiro cliente
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## Etapa 7 — Formulário de cadastro em 3 etapas

Criar `app/clients/new/page.tsx`:

```tsx
// app/clients/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Header from '@/components/layout/Header'
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

interface FormData {
  // Etapa 1
  name: string
  niche: string
  instagram_handle: string
  // Etapa 2
  target_audience: string
  products_services: string
  objectives: string
  // Etapa 3
  reference_brands: string
  avoid: string
  extra_context: string
}

const EMPTY: FormData = {
  name: '', niche: '', instagram_handle: '',
  target_audience: '', products_services: '', objectives: '',
  reference_brands: '', avoid: '', extra_context: '',
}

const NICHES = [
  'Moda e vestuário', 'Gastronomia e alimentação', 'Beleza e estética',
  'Fitness e saúde', 'Tecnologia', 'Educação', 'Casa e decoração',
  'Pets', 'Turismo e viagem', 'Finanças e investimentos',
  'Arte e cultura', 'Varejo local', 'Serviços profissionais', 'Outro',
]

export default function NewClientPage() {
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState<FormData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  const update = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }))

  const canNext = () => {
    if (step === 1) return form.name.trim() && form.niche.trim()
    if (step === 2) return form.target_audience.trim() && form.products_services.trim()
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // 1. Cria o cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          niche: form.niche,
          instagram_handle: form.instagram_handle.replace('@', '').trim() || null,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // 2. Monta briefing e chama API de geração de perfil
      const briefing = `
PÚBLICO-ALVO: ${form.target_audience}
PRODUTOS/SERVIÇOS: ${form.products_services}
OBJETIVOS: ${form.objectives || 'Não informado'}
MARCAS REFERÊNCIA: ${form.reference_brands || 'Não informado'}
O QUE EVITAR: ${form.avoid || 'Não informado'}
CONTEXTO ADICIONAL: ${form.extra_context || 'Não informado'}
      `.trim()

      toast.info('Gerando posicionamento com IA... pode levar até 30 segundos')

      const res = await fetch('/api/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefing, clientId: client.id }),
      })

      if (!res.ok) throw new Error('Erro ao gerar perfil')

      toast.success('Cliente cadastrado com sucesso!')
      router.push(`/clients/${client.id}`)

    } catch (err) {
      console.error(err)
      toast.error('Erro ao cadastrar cliente. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <Header title="Novo Cliente" showBack />

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(n => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              n < step ? 'bg-brand-600 text-white' :
              n === step ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
              'bg-surface-200 text-surface-400'
            }`}>
              {n < step ? '✓' : n}
            </div>
            {n < 3 && <div className={`flex-1 h-0.5 rounded transition-all ${n < step ? 'bg-brand-600' : 'bg-surface-200'}`} />}
          </div>
        ))}
      </div>

      {/* Etapa 1 — Informações básicas */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <p className="font-display font-bold text-lg text-surface-900 mb-1">Informações básicas</p>
            <p className="text-sm text-surface-500">Como se chama a marca e em que área atua?</p>
          </div>

          <div>
            <label className="label">Nome da marca *</label>
            <input className="input" placeholder="Ex: Studio Bela Arte" value={form.name} onChange={update('name')} autoFocus />
          </div>

          <div>
            <label className="label">Nicho *</label>
            <select className="input" value={form.niche} onChange={update('niche')}>
              <option value="">Selecione o nicho...</option>
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Instagram <span className="text-surface-400 font-normal">(opcional)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">@</span>
              <input className="input pl-7" placeholder="nomedapagina" value={form.instagram_handle} onChange={update('instagram_handle')} autoCapitalize="none" />
            </div>
          </div>
        </div>
      )}

      {/* Etapa 2 — Público e produto */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <p className="font-display font-bold text-lg text-surface-900 mb-1">Público e produto</p>
            <p className="text-sm text-surface-500">Quem é o cliente ideal e o que a marca oferece?</p>
          </div>

          <div>
            <label className="label">Público-alvo *</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Ex: Mulheres de 25 a 40 anos, classe média-alta, que buscam cuidados com a pele e bem-estar..."
              value={form.target_audience}
              onChange={update('target_audience')}
            />
          </div>

          <div>
            <label className="label">Produtos ou serviços *</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Ex: Tratamentos faciais, massagens relaxantes, venda de cosméticos naturais..."
              value={form.products_services}
              onChange={update('products_services')}
            />
          </div>

          <div>
            <label className="label">Objetivos nas redes sociais <span className="text-surface-400 font-normal">(opcional)</span></label>
            <input className="input" placeholder="Ex: Aumentar agendamentos, vender online, construir autoridade..." value={form.objectives} onChange={update('objectives')} />
          </div>
        </div>
      )}

      {/* Etapa 3 — Referências e contexto */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <p className="font-display font-bold text-lg text-surface-900 mb-1">Referências e estilo</p>
            <p className="text-sm text-surface-500">O que inspira a marca e o que deve ser evitado?</p>
          </div>

          <div>
            <label className="label">Marcas referência <span className="text-surface-400 font-normal">(opcional)</span></label>
            <input className="input" placeholder="Ex: O Boticário, Granado, Sallve..." value={form.reference_brands} onChange={update('reference_brands')} />
          </div>

          <div>
            <label className="label">O que NÃO quer ver no perfil <span className="text-surface-400 font-normal">(opcional)</span></label>
            <input className="input" placeholder="Ex: Tom agressivo, promoções excessivas, posts muito formais..." value={form.avoid} onChange={update('avoid')} />
          </div>

          <div>
            <label className="label">Contexto adicional <span className="text-surface-400 font-normal">(opcional)</span></label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Qualquer informação relevante que ajude a IA a entender melhor a marca..."
              value={form.extra_context}
              onChange={update('extra_context')}
            />
          </div>

          {/* Preview do que vai acontecer */}
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-800">A IA vai gerar automaticamente</p>
                <p className="text-xs text-brand-600 mt-1">Persona detalhada · Pilares de conteúdo · Tom de voz · Oportunidades de conteúdo</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegação */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => setStep(s => s - 1)}
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        )}

        {step < 3 ? (
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
          >
            Continuar
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando perfil...</>
              : <><Sparkles className="w-4 h-4" />Cadastrar e gerar perfil</>
            }
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## Etapa 8 — Página do cliente

Criar `app/clients/[id]/page.tsx`:

```tsx
// app/clients/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { FileText, BarChart2, CalendarDays, MessageCircle, ChevronRight, Instagram } from 'lucide-react'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*, client_profiles(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!client) notFound()

  const profile = client.client_profiles?.[0] ?? null

  return (
    <div className="page-container">
      <Header title={client.name} subtitle={client.niche} showBack />

      {/* Info rápida */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-2xl">{client.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-surface-900 truncate">{client.name}</p>
          <p className="text-sm text-surface-500">{client.niche}</p>
          {client.instagram_handle && (
            <div className="flex items-center gap-1 mt-0.5">
              <Instagram className="w-3 h-3 text-pink-500" />
              <span className="text-xs text-pink-500">@{client.instagram_handle}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="space-y-2 mb-8">
        <Link href={`/clients/${id}/plan`} className="card-hover p-4 flex items-center gap-4">
          <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-surface-900 text-sm">Pauta mensal</p>
            <p className="text-xs text-surface-500">Gerar 28 ideias de posts</p>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-300" />
        </Link>

        <Link href={`/analytics?client=${id}`} className="card-hover p-4 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-surface-900 text-sm">Métricas</p>
            <p className="text-xs text-surface-500">Analisar resultados do mês</p>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-300" />
        </Link>

        <Link href={`/clients/${id}/replies`} className="card-hover p-4 flex items-center gap-4">
          <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-surface-900 text-sm">Respostas</p>
            <p className="text-xs text-surface-500">Sugestões para comentários e DMs</p>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-300" />
        </Link>
      </div>

      {/* Documento de posicionamento */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-surface-400" />
          <h2 className="font-display font-semibold text-surface-900 text-sm">Posicionamento</h2>
        </div>

        {profile ? (
          <div className="space-y-3">

            {/* Persona */}
            <div className="card p-4">
              <p className="font-semibold text-surface-900 text-sm mb-2">👤 Persona</p>
              <p className="text-sm text-surface-600 mb-2">{profile.persona?.demographics}</p>
              {Array.isArray(profile.persona?.pain_points) && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 mb-1">Dores principais</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.persona.pain_points.slice(0, 3).map((p: string, i: number) => (
                      <span key={i} className="badge bg-red-50 text-red-600 text-xs">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pilares */}
            {Array.isArray(profile.pillars) && profile.pillars.length > 0 && (
              <div className="card p-4">
                <p className="font-semibold text-surface-900 text-sm mb-3">🏛️ Pilares de conteúdo</p>
                <div className="space-y-2">
                  {profile.pillars.map((pillar: { name: string; description: string }, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-surface-800">{pillar.name}</p>
                        <p className="text-xs text-surface-500">{pillar.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tom de voz */}
            {profile.tone_guidelines && (
              <div className="card p-4">
                <p className="font-semibold text-surface-900 text-sm mb-2">🎙️ Tom de voz</p>
                <p className="text-sm text-surface-600 whitespace-pre-line leading-relaxed">
                  {profile.tone_guidelines.slice(0, 400)}{profile.tone_guidelines.length > 400 ? '...' : ''}
                </p>
              </div>
            )}

          </div>
        ) : (
          <div className="card p-6 text-center">
            <Sparkles className="w-8 h-8 text-brand-300 mx-auto mb-2" />
            <p className="text-sm text-surface-500">Perfil ainda sendo gerado...</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Etapa 9 — Layout dos clients e analytics placeholder

Criar `app/clients/layout.tsx`:

```tsx
// app/clients/layout.tsx
import BottomNav from '@/components/layout/BottomNav'

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
      <BottomNav />
    </div>
  )
}
```

Criar `app/analytics/page.tsx`:

```tsx
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
```

Criar `app/analytics/layout.tsx`:

```tsx
// app/analytics/layout.tsx
import BottomNav from '@/components/layout/BottomNav'

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
      <BottomNav />
    </div>
  )
}
```

---

## Etapa 10 — Verificação final

Rodar no terminal:

```bash
npm run build
```

Se o build passar sem erros, o módulo está completo.

Testar manualmente:
- [ ] Login com miguelmmc08@gmail.com funciona
- [ ] Dashboard carrega com contador de clientes
- [ ] BottomNav navega entre Dashboard, Clientes e Métricas
- [ ] /clients/new abre o formulário em 3 etapas
- [ ] Formulário valida campos obrigatórios antes de avançar
- [ ] Cadastro chama /api/generate-profile e redireciona para o cliente
- [ ] Página do cliente exibe persona, pilares e tom de voz
- [ ] Tudo funciona no mobile (tela pequena, touch targets ok)

---

## Commit

```bash
git add .
git commit -m "feat(semana1): fundação + onboarding de cliente com Gemini

- lib/gemini.ts com getClientContext e callGeminiWithClient
- Tela de login com Supabase Auth
- Dashboard com stats reais e empty state
- Lista de clientes com busca por URL state
- Formulário de cadastro em 3 etapas mobile-first
- Integração /api/generate-profile com Gemini 2.5 Pro
- Página do cliente com posicionamento (persona, pilares, tom)
- Analytics placeholder para Semana 3"
```

---

## Próximo módulo

**SEMANA2.md** — Geração de pauta mensal (28 ideias) + posts individuais com legenda, hashtags, briefing visual e editor Tiptap.
