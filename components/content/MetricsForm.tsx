'use client'

// components/content/MetricsForm.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles, HelpCircle } from 'lucide-react'
import { getMonthName } from '@/lib/utils'
import { AnalyticsSnapshot } from '@/types'

interface Client { id: string; name: string; niche: string }

interface Props {
  client: Client
  month: number
  year: number
  onSuccess: (snapshot: AnalyticsSnapshot) => void
}

const EMPTY_METRICS = {
  reach: '',
  impressions: '',
  followers_gained: '',
  profile_visits: '',
  posts_count: '',
  avg_likes: '',
  avg_comments: '',
  avg_saves: '',
  avg_shares: '',
  best_performing_posts: '',
  worst_performing_posts: '',
  extra_notes: '',
}

/** Fora do Form: evita remount a cada tecla (componente interno = novo tipo em cada render). */
function MetricsNumberField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="label mb-0 text-xs">{label}</label>
        {hint && (
          <div className="group relative">
            <HelpCircle className="w-3.5 h-3.5 text-stone-300" />
            <div className="absolute bottom-full left-0 mb-1 w-48 bg-stone-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
              {hint}
            </div>
          </div>
        )}
      </div>
      <input
        type="number"
        className="input text-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        min="0"
        inputMode="numeric"
      />
    </div>
  )
}

export default function MetricsForm({ client, month, year, onSuccess }: Props) {
  const [metrics, setMetrics] = useState(EMPTY_METRICS)
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof EMPTY_METRICS) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setMetrics(m => ({ ...m, [field]: e.target.value }))

  async function handleSubmit() {
    // Valida campos obrigatórios
    const required = ['reach', 'impressions', 'followers_gained', 'posts_count'] as const
    const missing = required.filter(f => !metrics[f])
    if (missing.length > 0) {
      toast.error('Preencha pelo menos alcance, impressões, seguidores e nº de posts')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/analyze-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          month,
          year,
          metrics,
        }),
      })
      if (!res.ok) throw new Error()
      const { snapshot } = await res.json()
      toast.success('Relatório gerado!')
      onSuccess(snapshot)
    } catch {
      toast.error('Erro ao analisar métricas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Período selecionado — informativo, controlado pelo pai */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
        <span className="text-sm font-medium text-amber-800">
          Preenchendo métricas de {getMonthName(month)} {year}
        </span>
      </div>

      {/* Métricas principais */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Métricas principais</p>
        <div className="grid grid-cols-2 gap-3">
          <MetricsNumberField
            label="Alcance"
            value={metrics.reach}
            onChange={update('reach')}
            placeholder="Ex: 12400"
            hint="Total de contas únicas que viram seus posts"
          />
          <MetricsNumberField
            label="Impressões"
            value={metrics.impressions}
            onChange={update('impressions')}
            placeholder="Ex: 38200"
            hint="Total de vezes que seus conteúdos foram exibidos"
          />
          <MetricsNumberField
            label="Novos seguidores"
            value={metrics.followers_gained}
            onChange={update('followers_gained')}
            placeholder="Ex: 87"
            hint="Seguidores ganhos menos os perdidos no mês"
          />
          <MetricsNumberField
            label="Visitas ao perfil"
            value={metrics.profile_visits}
            onChange={update('profile_visits')}
            placeholder="Ex: 1240"
            hint="Quantas vezes o perfil foi acessado"
          />
          <MetricsNumberField
            label="Posts publicados"
            value={metrics.posts_count}
            onChange={update('posts_count')}
            placeholder="Ex: 20"
          />
        </div>
      </div>

      {/* Médias de engajamento */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Médias por post</p>
        <div className="grid grid-cols-2 gap-3">
          <MetricsNumberField
            label="Curtidas"
            value={metrics.avg_likes}
            onChange={update('avg_likes')}
            placeholder="Ex: 145"
          />
          <MetricsNumberField
            label="Comentários"
            value={metrics.avg_comments}
            onChange={update('avg_comments')}
            placeholder="Ex: 12"
          />
          <MetricsNumberField
            label="Salvamentos"
            value={metrics.avg_saves}
            onChange={update('avg_saves')}
            placeholder="Ex: 28"
            hint="Importante: salvamentos indicam conteúdo de valor"
          />
          <MetricsNumberField
            label="Compartilhamentos"
            value={metrics.avg_shares}
            onChange={update('avg_shares')}
            placeholder="Ex: 8"
          />
        </div>
      </div>

      {/* Contexto qualitativo */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Contexto qualitativo</p>
        <div className="space-y-3">
          <div>
            <label className="label text-xs">Posts que mais engajaram <span className="text-stone-400 font-normal">(opcional)</span></label>
            <input
              className="input text-sm"
              placeholder="Ex: Reels de antes/depois, carrossel sobre cuidados da pele..."
              value={metrics.best_performing_posts}
              onChange={update('best_performing_posts')}
            />
          </div>
          <div>
            <label className="label text-xs">Posts que menos engajaram <span className="text-stone-400 font-normal">(opcional)</span></label>
            <input
              className="input text-sm"
              placeholder="Ex: Posts de produto sem contexto, stories promocionais..."
              value={metrics.worst_performing_posts}
              onChange={update('worst_performing_posts')}
            />
          </div>
          <div>
            <label className="label text-xs">Observações adicionais <span className="text-stone-400 font-normal">(opcional)</span></label>
            <textarea
              className="input text-sm min-h-[80px] resize-none"
              placeholder="Contexto relevante do mês: campanha, evento, mudança de frequência de posts..."
              value={metrics.extra_notes}
              onChange={update('extra_notes')}
            />
          </div>
        </div>
      </div>

      {/* Preview do que vai acontecer */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">A IA vai gerar automaticamente</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Destaques com números reais · Oportunidades estratégicas · Padrões da audiência · 5 recomendações acionáveis · Resumo executivo pronto para enviar
            </p>
          </div>
        </div>
      </div>

      <button
        className="btn-primary w-full flex items-center justify-center gap-2"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" />Analisando métricas...</>
          : <><Sparkles className="w-4 h-4" />Gerar relatório de {getMonthName(month)}</>
        }
      </button>
    </div>
  )
}
