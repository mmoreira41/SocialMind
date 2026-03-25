<div align="center">

<br />

```
  ███████╗ ██████╗  ██████╗██╗ █████╗ ██╗     ███╗   ███╗██╗███╗   ██╗██████╗
  ██╔════╝██╔═══██╗██╔════╝██║██╔══██╗██║     ████╗ ████║██║████╗  ██║██╔══██╗
  ███████╗██║   ██║██║     ██║███████║██║     ██╔████╔██║██║██╔██╗ ██║██║  ██║
  ╚════██║██║   ██║██║     ██║██╔══██║██║     ██║╚██╔╝██║██║██║╚██╗██║██║  ██║
  ███████║╚██████╔╝╚██████╗██║██║  ██║███████╗██║ ╚═╝ ██║██║██║ ╚████║██████╔╝
  ╚══════╝ ╚═════╝  ╚═════╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝
```

**Sistema de gestão de social media com IA — do briefing ao post, em minutos.**

<br />

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Pro-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<br />

</div>

---

## O que é o SocialMind

SocialMind é um sistema interno de gestão de social media construído para uma profissional da área operar mais clientes com mais qualidade em menos tempo. Cada chamada de IA carrega o contexto completo da marca — persona, pilares de conteúdo, tom de voz, referências — garantindo que o sistema nunca responda de forma genérica.

O que um social media gasta em **15–20 horas por cliente por mês**, o SocialMind reduz para **5–7 horas**. Sem perda de qualidade. Com ganho de estratégia.

---

## Funcionalidades

| Módulo | O que faz |
|--------|-----------|
| **Posicionamento** | Gera documento completo de marca a partir de um briefing — persona, pilares, tom de voz, oportunidades |
| **Pauta mensal** | Cria 28 ideias de posts organizadas por semana, objetivo e formato, com contexto de marca |
| **Geração de posts** | Produz legenda completa, hashtags, versão stories, briefing visual e variações por plataforma |
| **Análise de métricas** | Transforma dados brutos do Instagram em relatório estratégico com resumo pronto para o cliente |
| **Respostas** | Sugere 3 opções de resposta para comentários e DMs no tom exato de cada marca |
| **Geração de imagem** | Cria artes prontas para Instagram via Gemini Image com contexto de marca e prompts curados |

---

## Stack

```
Frontend      Next.js 15 (App Router · Server Components · Server Actions)
Banco         Supabase (PostgreSQL · Auth · Storage · RLS)
IA — Texto    Google Gemini 2.5 Pro / 2.5 Flash
IA — Imagem   Gemini Image — Nano Banana 2 (gemini-3.1-flash-image-preview)
UI            Tailwind CSS — design system próprio mobile-first
Fontes        Sora (display) + DM Sans (corpo)
Editor        Tiptap
Deploy        Vercel (frontend) · Supabase Cloud (banco)
```

---

## Arquitetura

```
socialmind/
├── app/
│   ├── auth/login/              → Autenticação
│   ├── dashboard/               → Home com stats e ações rápidas
│   ├── clients/
│   │   ├── page.tsx             → Lista de clientes com busca
│   │   ├── new/                 → Cadastro em 3 etapas
│   │   └── [id]/
│   │       ├── page.tsx         → Perfil + documento de posicionamento
│   │       ├── plan/            → Pauta mensal
│   │       ├── posts/new/       → Geração de post individual
│   │       └── replies/         → Respostas de comunidade
│   ├── analytics/               → Análise de métricas mensais
│   └── api/
│       ├── generate-profile/    → Briefing → posicionamento completo
│       ├── generate-content-plan/ → 28 ideias mensais com contexto de marca
│       ├── generate-post/       → Legenda · hashtags · stories · briefing visual
│       ├── generate-image/      → Arte pronta para Instagram via Gemini Image
│       ├── analyze-metrics/     → Dados brutos → relatório estratégico
│       ├── generate-replies/    → Comentários/DMs → 3 opções de resposta
│       ├── update-plan-approvals/ → Persistência de aprovações na pauta
│       ├── update-post-caption/ → Salva legenda editada
│       └── get-analytics/       → Histórico de análises por cliente e mês
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx        → Navegação inferior mobile
│   │   └── Header.tsx           → Header com back e action slot
│   └── content/
│       ├── PlanView.tsx         → Grid de ideias com aprovar/rejeitar
│       ├── PostGenerator.tsx    → Editor Tiptap + geração completa
│       ├── ImageGenerator.tsx   → Fluxo de 3 perguntas + Gemini Image
│       ├── AnalyticsView.tsx    → Orquestra formulário/relatório
│       ├── MetricsForm.tsx      → Input de métricas com validação
│       ├── AnalyticsReport.tsx  → Relatório com seções colapsáveis
│       └── RepliesView.tsx      → Cards de resposta por tipo
├── lib/
│   ├── supabase/                → Clients para browser, server e middleware
│   ├── gemini.ts                → Helper com getClientContext() e todas as chamadas IA
│   ├── promptLibrary.ts         → Exemplos curados da nano-banana-pro skill
│   └── utils.ts                 → cn() · labels · constantes
├── types/index.ts               → Tipos TypeScript do domínio
├── supabase/schema.sql          → Schema completo com RLS e triggers
└── CLAUDE.md                    → Memória do projeto para Claude Code
```

---

## Como o contexto de marca funciona

O diferencial central do sistema. Toda chamada de IA injeta o perfil completo do cliente:

```typescript
// lib/gemini.ts
async function getClientContext(clientId: string): Promise<string> {
  // Busca cliente + client_profile do Supabase
  // Monta system prompt com persona, pilares, tom de voz e referências
  // Retorna contexto rico que é injetado em TODAS as chamadas
}

// Uso em qualquer API route
const result = await callGeminiWithClient(clientId, userPrompt)
// O modelo recebe: contexto completo da marca + prompt específico da tarefa
```

O modelo nunca responde de forma genérica. Uma legenda para uma marca de moda cristã minimalista soa completamente diferente de uma para uma clínica veterinária — porque o sistema conhece profundamente cada marca.

---

## Schema do banco

```sql
clients              → dados básicos de cada cliente gerenciado
client_profiles      → documento de posicionamento (persona · pilares · tom de voz)
content_plans        → pautas mensais com ideias geradas e aprovadas
posts                → posts individuais com legenda · hashtags · imagem · status
analytics_snapshots  → análises mensais com destaques · recomendações · resumo
```

Todas as tabelas têm RLS ativo. O usuário vê apenas seus próprios dados — sem filtro manual no código.

---

## Setup

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- API key no [Google AI Studio](https://aistudio.google.com)

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/socialmind.git
cd socialmind
npm install
```

### 2. Configure o Supabase

Crie um projeto em [supabase.com](https://supabase.com), acesse o **SQL Editor** e execute:

```bash
# Cole o conteúdo de supabase/schema.sql e execute
```

Crie o usuário em **Authentication → Users → Add user**.

### 3. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google AI
GEMINI_API_KEY=AIza...
GEMINI_MODEL_TEXT=gemini-2.5-pro
GEMINI_MODEL_FAST=gemini-2.5-flash
GEMINI_MODEL_IMAGE=gemini-3.1-flash-image-preview

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Rode

```bash
npm run dev
```

Acesse `http://localhost:3000`

---

## Deploy

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Após configurar as variáveis de ambiente no painel da Vercel
vercel --prod
```

Após o deploy, atualizar no Supabase em **Authentication → URL Configuration**:
- **Site URL:** `https://seu-projeto.vercel.app`
- **Redirect URLs:** `https://seu-projeto.vercel.app/**`

---

## PWA

O sistema é instalável como app no celular. No iOS Safari ou Android Chrome, acessar a URL de produção e adicionar à tela inicial. O app abre sem barra do browser com theme color laranja.

---

## Modelo de IA

| Tarefa | Modelo | Motivo |
|--------|--------|--------|
| Posicionamento de marca | Gemini 2.5 Pro | Alta complexidade estratégica |
| Pauta mensal | Gemini 2.5 Pro | Criatividade + contexto longo |
| Análise de métricas | Gemini 2.5 Pro | Raciocínio analítico |
| Geração de post | Gemini 2.5 Flash | Velocidade suficiente, custo menor |
| Respostas de comunidade | Gemini 2.5 Flash | Tarefa simples, resposta rápida |
| Geração de imagem | Gemini Image (Nano Banana 2) | Estado da arte em imagem |

---

## Roadmap

- [x] Auth + dashboard
- [x] Cadastro de cliente + documento de posicionamento
- [x] Pauta mensal com 28 ideias
- [x] Geração de posts com editor inline
- [x] Análise de métricas + relatório executivo
- [x] Respostas para comentários e DMs
- [x] Geração de imagem com Gemini Image
- [ ] Integração com Meta Ads API (monitoramento de criativos)
- [ ] ClickUp MCP (pedidos via task → conteúdo gerado)
- [ ] Multi-usuário (Cenário 2 — micro-agência)
- [ ] SaaS público (Cenário 3)

---

## Decisões técnicas

**Web + PWA em vez de app nativo** — a usuária acessa pelo celular via browser. PWA entrega a experiência de app sem duplicar codebase ou depender de loja.

**Design system próprio em vez de shadcn/ui** — shadcn é desktop-first. O sistema foi construído mobile-first desde o início, com classes utilitárias específicas para touch.

**API routes para IA, nunca client-side** — chaves de API nunca expostas no browser. Chamadas longas (até 30s) não quebram por timeout no cliente.

**Supabase em vez de backend próprio** — auth, RLS, storage e realtime prontos eliminam semanas de setup. O custo do MVP com uma usuária é zero.

**RLS no banco, sem filtro no código** — segurança na camada de dados. Nenhuma query precisa de `.eq('user_id', user.id)` — o banco garante o isolamento.

**Gemini em vez de Claude API inicialmente** — créditos disponíveis no Google Cloud. Arquitetura preparada para migrar rotas complexas para Claude Sonnet 4.6 quando a API key estiver disponível.

---

## Licença

Uso privado. Todos os direitos reservados.

---

<div align="center">

Construído com foco em velocidade, qualidade e resultado real.

**SocialMind** — do briefing ao post, em minutos.

</div>
