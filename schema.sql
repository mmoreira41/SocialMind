-- ============================================================
-- SocialMind — Schema Completo + RLS + Indexes + Triggers
-- Execute no Supabase SQL Editor
-- Versão: 1.0 — MVP Cenário 1
-- ============================================================

-- ─── Extensões ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Limpar schema anterior (seguro para re-executar) ────────
drop table if exists analytics_snapshots cascade;
drop table if exists posts              cascade;
drop table if exists content_plans     cascade;
drop table if exists client_profiles   cascade;
drop table if exists clients           cascade;
drop function if exists update_updated_at cascade;

-- ============================================================
-- TABELA: clients
-- ============================================================
create table clients (
  id               uuid        primary key default uuid_generate_v4(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  name             text        not null,
  niche            text        not null,
  instagram_handle text,
  logo_url         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table  clients             is 'Clientes gerenciados pela social media';
comment on column clients.user_id     is 'FK para auth.users — base do isolamento RLS';
comment on column clients.niche       is 'Nicho de mercado: moda, gastronomia, tech, etc.';

alter table clients enable row level security;

create policy "clients: usuario gerencia apenas os seus"
  on clients for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TABELA: client_profiles
-- ============================================================
create table client_profiles (
  id                    uuid        primary key default uuid_generate_v4(),
  client_id             uuid        not null unique references clients(id) on delete cascade,
  persona               jsonb       not null default '{}',
  pillars               jsonb       not null default '[]',
  tone_guidelines       text        not null default '',
  content_opportunities text        not null default '',
  references_analysis   text        not null default '',
  raw_briefing          text        not null default '',
  updated_at            timestamptz not null default now()
);

comment on table  client_profiles                     is 'Documento de posicionamento gerado por IA';
comment on column client_profiles.persona             is '{ demographics, psychographics, pain_points[], desires[], language_they_use[] }';
comment on column client_profiles.pillars             is 'Array de { name, description, examples[] }';
comment on column client_profiles.tone_guidelines     is '10+ diretrizes especificas de tom de voz';
comment on column client_profiles.raw_briefing        is 'Briefing original do onboarding';

alter table client_profiles enable row level security;

create policy "client_profiles: acesso via cliente do usuario"
  on client_profiles for all
  using (
    exists (
      select 1 from clients
      where clients.id = client_profiles.client_id
        and clients.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from clients
      where clients.id = client_profiles.client_id
        and clients.user_id = auth.uid()
    )
  );

-- ============================================================
-- TABELA: content_plans
-- ============================================================
create table content_plans (
  id              uuid        primary key default uuid_generate_v4(),
  client_id       uuid        not null references clients(id) on delete cascade,
  month           int         not null check (month between 1 and 12),
  year            int         not null check (year >= 2024),
  status          text        not null default 'generating'
                              check (status in ('generating', 'ready', 'active')),
  generated_ideas jsonb       not null default '[]',
  approved_ideas  jsonb       not null default '[]',
  month_context   text        not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (client_id, month, year)
);

comment on table  content_plans               is 'Pauta mensal com 28 ideias geradas por IA';
comment on column content_plans.month_context is 'Eventos e contexto do mes informados pela usuaria';
comment on column content_plans.status        is 'generating | ready | active';

alter table content_plans enable row level security;

create policy "content_plans: acesso via cliente do usuario"
  on content_plans for all
  using (
    exists (
      select 1 from clients
      where clients.id = content_plans.client_id
        and clients.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from clients
      where clients.id = content_plans.client_id
        and clients.user_id = auth.uid()
    )
  );

-- ============================================================
-- TABELA: posts
-- ============================================================
create table posts (
  id                 uuid        primary key default uuid_generate_v4(),
  content_plan_id    uuid        not null references content_plans(id) on delete cascade,
  client_id          uuid        not null references clients(id) on delete cascade,
  idea               jsonb       not null default '{}',
  caption_draft      text        not null default '',
  caption_final      text,
  hashtags           jsonb       not null default '[]',
  stories_version    text,
  visual_brief       text        not null default '',
  caption_variations jsonb       not null default '[]',
  image_url          text,
  scheduled_for      timestamptz,
  status             text        not null default 'draft'
                     check (status in ('draft','approved','rejected','scheduled','posted')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table  posts                    is 'Posts individuais gerados por IA';
comment on column posts.idea               is '{ week, title, format, platform, hook, objective }';
comment on column posts.caption_draft      is 'Legenda gerada pela IA para edicao';
comment on column posts.caption_final      is 'Legenda editada e aprovada pela usuaria';
comment on column posts.visual_brief       is 'Briefing para Canva ou geracao de imagem IA';
comment on column posts.image_url          is 'URL da imagem gerada (Sprint 5+ Gemini)';

alter table posts enable row level security;

create policy "posts: acesso via cliente do usuario"
  on posts for all
  using (
    exists (
      select 1 from clients
      where clients.id = posts.client_id
        and clients.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from clients
      where clients.id = posts.client_id
        and clients.user_id = auth.uid()
    )
  );

-- ============================================================
-- TABELA: analytics_snapshots
-- ============================================================
create table analytics_snapshots (
  id                uuid        primary key default uuid_generate_v4(),
  client_id         uuid        not null references clients(id) on delete cascade,
  month             int         not null check (month between 1 and 12),
  year              int         not null check (year >= 2024),
  raw_data          jsonb       not null default '{}',
  highlights        jsonb       not null default '[]',
  opportunities     jsonb       not null default '[]',
  patterns          jsonb       not null default '[]',
  recommendations   jsonb       not null default '[]',
  executive_summary text        not null default '',
  captured_at       timestamptz not null default now(),
  unique (client_id, month, year)
);

comment on table  analytics_snapshots                  is 'Analise mensal de metricas gerada por IA';
comment on column analytics_snapshots.raw_data         is 'Metricas brutas inseridas pela usuaria';
comment on column analytics_snapshots.highlights       is 'Array de 3-5 destaques com numeros reais';
comment on column analytics_snapshots.opportunities    is 'O que nao funcionou + hipoteses estrategicas';
comment on column analytics_snapshots.patterns         is 'Padroes de comportamento da audiencia';
comment on column analytics_snapshots.recommendations  is '5 acoes especificas para o proximo mes';
comment on column analytics_snapshots.executive_summary is '3 paragrafos prontos para enviar ao cliente';

alter table analytics_snapshots enable row level security;

create policy "analytics_snapshots: acesso via cliente do usuario"
  on analytics_snapshots for all
  using (
    exists (
      select 1 from clients
      where clients.id = analytics_snapshots.client_id
        and clients.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from clients
      where clients.id = analytics_snapshots.client_id
        and clients.user_id = auth.uid()
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_clients_user_id            on clients(user_id);
create index idx_client_profiles_client_id  on client_profiles(client_id);
create index idx_content_plans_client_month on content_plans(client_id, month, year);
create index idx_posts_client_id            on posts(client_id);
create index idx_posts_content_plan_id      on posts(content_plan_id);
create index idx_posts_status               on posts(status);
create index idx_analytics_client_month     on analytics_snapshots(client_id, month, year);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

create trigger trg_content_plans_updated_at
  before update on content_plans
  for each row execute function update_updated_at();

create trigger trg_posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- ============================================================
-- VERIFICACAO FINAL
-- Roda apos criar o usuario em Authentication -> Users
-- ============================================================
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'miguelmmc08@gmail.com'
  limit 1;

  if v_user_id is null then
    raise notice '⚠️  Crie o usuario miguelmmc08@gmail.com em Authentication -> Users primeiro, depois re-execute apenas este bloco.';
  else
    raise notice '✅ Usuario encontrado: % — Schema 100%% pronto!', v_user_id;
  end if;
end;
$$;
