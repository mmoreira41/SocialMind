# SocialMind — CLAUDE.md
> Memória permanente do projeto. Leia este arquivo antes de qualquer ação.

## O que é este projeto

SocialMind é um sistema web interno de gestão de social media com IA, construído para uma social media profissional operar mais clientes com mais qualidade em menos tempo. É um PWA mobile-first (sem app nativo).

**Usuária única:** miguelmmc08@gmail.com  
**Status atual:** MVP Cenário 1 — sistema interno para 1 usuária  
**Objetivo:** validar em 4 semanas, depois expandir para Cenário 2 (beta users) e Cenário 3 (SaaS)

---

## Stack

| Camada | Tecnologia | Notas |
|--------|-----------|-------|
| Framework | Next.js 15 (App Router) | Server Components + Server Actions |
| Banco | Supabase (PostgreSQL) | Auth + RLS + Storage |
| IA principal | Google Gemini 2.5 Pro | Texto e raciocínio estratégico |
| IA rápida | Gemini 2.0 Flash | Tarefas simples e respostas rápidas |
| IA imagem | Gemini 2.0 Flash Exp | Sprint 5+ (Nano Banana Pro) |
| UI | Tailwind CSS + design system próprio | Mobile-first, SEM shadcn/ui |
| Fontes | Sora (display) + DM Sans (corpo) | via next/font/google |
| Editor | Tiptap | Para edição de legendas geradas |
| Toasts | Sonner | Notificações de UI |
| Deploy | Vercel (frontend) + Supabase Cloud | |
| Infra futura | Hetzner VPS + Docker + Traefik | Para MCP server de imagem |

**IMPORTANTE:** Anthropic API será adicionada no próximo mês. Por enquanto TODO o texto é gerado via Gemini. Quando a key Anthropic chegar, migrar apenas as rotas complexas (generate-profile, generate-content-plan) para Claude Sonnet 4.6.

---

## Estrutura de diretórios

```
socialmind/
├── app/
│   ├── auth/login/              → Tela de login
│   ├── dashboard/
│   │   ├── layout.tsx           → Layout com BottomNav
│   │   └── page.tsx             → Home com stats
│   ├── clients/
│   │   ├── page.tsx             → Lista de clientes
│   │   ├── new/page.tsx         → Cadastro em 3 etapas
│   │   └── [id]/
│   │       ├── page.tsx         → Perfil do cliente
│   │       ├── plan/page.tsx    → Pauta mensal
│   │       └── posts/[postId]/  → Post individual
│   ├── analytics/page.tsx       → Análise de métricas
│   ├── api/
│   │   ├── generate-profile/    → Briefing → posicionamento
│   │   ├── generate-content-plan/ → 28 ideias mensais
│   │   ├── generate-post/       → Post completo
│   │   ├── analyze-metrics/     → Relatório mensal
│   │   └── generate-replies/    → Respostas comentários
│   ├── globals.css              → Design tokens + classes utilitárias
│   └── layout.tsx               → Root com fontes + Toaster
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx        → Navegação inferior mobile
│   │   └── Header.tsx           → Header com back + action
│   ├── client/                  → Componentes de cliente
│   ├── content/                 → Componentes de posts/pauta
│   └── ui/                      → Componentes reutilizáveis base
├── lib/
│   ├── supabase/
│   │   ├── client.ts            → Browser client
│   │   ├── server.ts            → Server client
│   │   └── middleware.ts        → Auth middleware
│   ├── gemini.ts                → Helper Gemini com contexto de cliente
│   └── utils.ts                 → cn(), labels, constantes
├── types/index.ts               → Todos os tipos TypeScript
├── supabase/schema.sql          → Schema completo + RLS
├── public/manifest.json         → PWA manifest
├── middleware.ts                → Auth guard de rotas
├── CLAUDE.md                    → Este arquivo
└── .env.local                   → Variáveis (nunca no git)
```

---

## Padrões obrigatórios

### Chamadas de IA
- **SEMPRE** usar `lib/gemini.ts` — nunca chamar a API diretamente nos componentes
- **SEMPRE** passar `clientId` para que o contexto de marca seja carregado automaticamente
- Gemini 2.5 Pro para: generate-profile, generate-content-plan, analyze-metrics
- Gemini 2.0 Flash para: generate-post, generate-replies (mais rápido, suficiente)
- Retornar sempre JSON puro — usar `parseGeminiJSON()` para parse seguro

### Supabase
- **NUNCA** escrever no banco direto do cliente — apenas leitura
- Toda escrita via **Server Action** ou **API Route** no servidor
- RLS está ativo em todas as tabelas — não precisa de filtro manual
- Usar `createClient()` do server para Server Components e API routes
- Usar `createClient()` do browser para Client Components que só leem

### Componentes
- Todos os botões com mínimo 44px de altura (touch target mobile)
- Loading states obrigatórios em toda chamada de IA (pode demorar 10–20s)
- Usar classes utilitárias do globals.css: `btn-primary`, `btn-secondary`, `card`, `card-hover`, `input`, `label`, `badge`, `page-container`
- **SEM** shadcn/ui — o design system é próprio e mobile-first

### TypeScript
- Tipos em `types/index.ts` — nunca definir tipos inline em componentes
- Sem `any` — usar tipos explícitos sempre
- Props de componentes com interface nomeada acima do componente

### Commits
- Padrão semântico: `feat:`, `fix:`, `chore:`, `refactor:`
- Exemplo: `feat(clients): formulário de cadastro em 3 etapas`

---

## Contexto de cliente — como funciona

O diferencial central do sistema é que **toda chamada de IA carrega o perfil completo do cliente**. A função `getClientContext(clientId)` em `lib/gemini.ts` busca o `client_profile` do Supabase e monta o system prompt com persona, pilares, tom de voz e referências. O modelo nunca responde de forma genérica.

```typescript
// Exemplo de uso em qualquer API route
const context = await getClientContext(clientId)
const result = await callGeminiWithClient(clientId, userPrompt)
```

---

## Roadmap de módulos

| Módulo | Arquivo | Status |
|--------|---------|--------|
| Setup base | — | ✅ Repositório criado |
| Semana 1 | SEMANA1.md | 🔄 Próximo |
| Semana 2 | SEMANA2.md | ⏳ Aguardando |
| Semana 3 | SEMANA3.md | ⏳ Aguardando |
| Semana 4 | SEMANA4.md | ⏳ Aguardando |
| Sprint 5+ | SPRINT5.md | ⏳ Pós-validação |

---

## Skills disponíveis no Claude Code

Ao criar ou modificar componentes de UI, sempre aplicar as seguintes skills:

- `.claude/skills/animation-principles.md` — animações purposeful, durações corretas, easing natural
- `.claude/skills/loading-states.md` — skeletons, spinners, optimistic UI, progressive loading
- `.claude/skills/error-handling-ux.md` — prevenção, detecção, comunicação e recuperação de erros
- `.claude/skills/front/frontend-design.md` — direção estética e implementação de interfaces frontend de alta qualidade
- `.claude/skills/ui-ux-pro-max.md` — guia abrangente de UI/UX com padrões de acessibilidade, interação e responsividade

Instale antes de começar:
```bash
# Skill de frontend design (qualidade de UI)
# Já disponível em /mnt/skills/public/frontend-design/SKILL.md

# Sprint 5+ — geração de imagem
npx skills i YouMind-OpenLab/nano-banana-pro-prompts-recommend-skill
```

---

## Variáveis de ambiente necessárias

```bash
NEXT_PUBLIC_SUPABASE_URL        # URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Anon key pública
SUPABASE_SERVICE_ROLE_KEY       # Service role (só no servidor)
GEMINI_API_KEY                  # Google AI Studio
GEMINI_MODEL_TEXT               # gemini-2.5-pro
GEMINI_MODEL_FAST               # gemini-2.0-flash
GEMINI_MODEL_IMAGE              # gemini-2.0-flash-exp
NEXT_PUBLIC_APP_URL             # http://localhost:3000
```

---

## Decisões que NÃO devem ser revertidas

1. **Web + PWA, sem React Native** — a usuária acessa pelo celular via browser
2. **Sem shadcn/ui** — design system próprio é mobile-first e mais leve
3. **Gemini agora, Claude depois** — migrar rotas complexas quando ANTHROPIC_API_KEY chegar
4. **RLS no banco, sem filtro no código** — segurança na camada de dados
5. **API Routes para IA, nunca client-side** — chaves nunca expostas no browser

---

## Contato do projeto
- Dev: Miguel (miguelmmc08@gmail.com)
- Usuária: social media parceira
- Repositório: socialmind/
