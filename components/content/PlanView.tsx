// components/content/PlanView.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Sparkles, Calendar, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { ContentIdea } from '@/types'
import { cn, OBJECTIVE_COLORS, FORMAT_LABELS, OBJECTIVE_LABELS, getMonthName } from '@/lib/utils'

interface PlanData {
  id: string
  status: string
  generated_ideas: ContentIdea[]
  approved_ideas: ContentIdea[]
}

interface Props {
  client: { id: string; name: string; niche: string }
  initialPlan: PlanData | null
  month: number
  year: number
}

const WEEKS = [1, 2, 3, 4] as const

export default function PlanView({ client, initialPlan, month, year }: Props) {
  const [plan, setPlan]           = useState<PlanData | null>(initialPlan)
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [context, setContext]     = useState('')
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]))

  const ideas: ContentIdea[] = plan?.generated_ideas ?? []
  const approved = new Set<string>(
    (plan?.approved_ideas ?? []).map((i: ContentIdea) => i.id)
  )

  async function generatePlan() {
    setLoading(true)
    setShowModal(false)
    try {
      const res = await fetch('/api/generate-content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, month, year, monthContext: context }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPlan({
        id: data.planId,
        status: 'ready',
        generated_ideas: data.ideas,
        approved_ideas: plan?.approved_ideas ?? [],
      })
      setOpenWeeks(new Set([1]))
      toast.success(`${data.ideas.length} ideias geradas!`)
    } catch {
      toast.error('Erro ao gerar pauta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleApprove(idea: ContentIdea) {
    if (!plan) return
    const isApproved = approved.has(idea.id)
    const newApproved = isApproved
      ? plan.approved_ideas.filter((i: ContentIdea) => i.id !== idea.id)
      : [...plan.approved_ideas, idea]

    setPlan(p => p ? { ...p, approved_ideas: newApproved } : p)

    await fetch('/api/update-plan-approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id, approvedIdeas: newApproved }),
    })
  }

  const weekIdeas = (week: number) => ideas.filter(i => i.week === week)
  const weekApproved = (week: number) =>
    weekIdeas(week).filter(i => approved.has(i.id)).length

  // Estado vazio
  if (!plan || ideas.length === 0) {
    return (
      <>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-amber-400" />
          </div>
          <p className="font-display font-semibold text-surface-900 mb-1">
            Nenhuma pauta para {getMonthName(month)}
          </p>
          <p className="text-sm text-surface-400 mb-6">
            Gere 28 ideias de posts personalizadas para {client.name}
          </p>
          <button
            className="btn-primary flex items-center gap-2 mx-auto"
            onClick={() => setShowModal(true)}
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando pauta...</>
              : <><Sparkles className="w-4 h-4" />Gerar pauta de {getMonthName(month)}</>
            }
          </button>
        </div>

        {showModal && (
          <ContextModal
            month={month}
            year={year}
            context={context}
            onChangeContext={setContext}
            onConfirm={generatePlan}
            onCancel={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      {/* Header da pauta */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-surface-500 font-medium">
            {getMonthName(month)} {year}
          </p>
          <p className="text-xs text-surface-400">
            {approved.size} de {ideas.length} aprovadas
          </p>
        </div>
        <button
          className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-3"
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Sparkles className="w-3.5 h-3.5" />
          }
          Regenerar
        </button>
      </div>

      {/* Semanas */}
      <div className="space-y-3">
        {WEEKS.map(week => (
          <WeekSection
            key={week}
            week={week}
            ideas={weekIdeas(week)}
            approvedCount={weekApproved(week)}
            isOpen={openWeeks.has(week)}
            onToggle={() => {
              setOpenWeeks(prev => {
                const next = new Set(prev)
                next.has(week) ? next.delete(week) : next.add(week)
                return next
              })
            }}
            onApprove={toggleApprove}
            approved={approved}
            clientId={client.id}
            planId={plan.id}
          />
        ))}
      </div>

      {showModal && (
        <ContextModal
          month={month}
          year={year}
          context={context}
          onChangeContext={setContext}
          onConfirm={generatePlan}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}

// ─── WeekSection ──────────────────────────────────────────────
function WeekSection({
  week, ideas, approvedCount, isOpen, onToggle,
  onApprove, approved, clientId, planId,
}: {
  week: number
  ideas: ContentIdea[]
  approvedCount: number
  isOpen: boolean
  onToggle: () => void
  onApprove: (idea: ContentIdea) => void
  approved: Set<string>
  clientId: string
  planId: string
}) {
  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left active:bg-surface-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
          >
            <span className="text-white font-display font-bold text-sm">{week}</span>
          </div>
          <div>
            <p className="font-display font-semibold text-surface-900 text-sm">Semana {week}</p>
            <p className="text-xs text-surface-400">
              {approvedCount} de {ideas.length} aprovadas
            </p>
          </div>
        </div>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-surface-400" />
          : <ChevronDown className="w-4 h-4 text-surface-400" />
        }
      </button>

      {isOpen && (
        <div className="border-t border-surface-100">
          {ideas.map((idea, idx) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isApproved={approved.has(idea.id)}
              onApprove={() => onApprove(idea)}
              clientId={clientId}
              planId={planId}
              isLast={idx === ideas.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── IdeaCard ─────────────────────────────────────────────────
function IdeaCard({
  idea, isApproved, onApprove, clientId, planId, isLast,
}: {
  idea: ContentIdea
  isApproved: boolean
  onApprove: () => void
  clientId: string
  planId: string
  isLast: boolean
}) {
  return (
    <div className={cn(
      'flex items-start gap-3 p-3.5 transition-colors',
      isApproved ? 'bg-amber-50/60' : 'hover:bg-surface-50',
      !isLast && 'border-b border-surface-100'
    )}>
      {/* Checkbox de aprovação */}
      <button
        onClick={onApprove}
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
          isApproved
            ? 'border-amber-500 bg-amber-500'
            : 'border-surface-300 hover:border-amber-400'
        )}
      >
        {isApproved && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium leading-snug',
          isApproved ? 'text-surface-900' : 'text-surface-700'
        )}>
          {idea.title}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <span className={cn('badge text-xs', OBJECTIVE_COLORS[idea.objective] ?? 'bg-surface-100 text-surface-500')}>
            {OBJECTIVE_LABELS[idea.objective] ?? idea.objective}
          </span>
          <span className="badge bg-surface-100 text-surface-500 text-xs">
            {FORMAT_LABELS[idea.format] ?? idea.format}
          </span>
        </div>
        {idea.hook && (
          <p className="text-xs text-surface-400 mt-1 italic line-clamp-1">
            &ldquo;{idea.hook}&rdquo;
          </p>
        )}
      </div>

      {/* Botão de gerar post — só se aprovada */}
      {isApproved && (
        <Link
          href={`/clients/${clientId}/posts/new?planId=${planId}&ideaId=${idea.id}`}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </Link>
      )}
    </div>
  )
}

// ─── ContextModal ─────────────────────────────────────────────
function ContextModal({
  month, year, context, onChangeContext, onConfirm, onCancel,
}: {
  month: number
  year: number
  context: string
  onChangeContext: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto p-6 animate-slide-up">
        <h3 className="font-display font-bold text-lg text-surface-900 mb-1">
          Pauta de {getMonthName(month)} {year}
        </h3>
        <p className="text-sm text-surface-400 mb-5">
          Tem algo especial neste mês? A IA vai considerar na geração.
        </p>

        <label className="label">
          Contexto do mês{' '}
          <span className="text-surface-300 font-normal normal-case tracking-normal">(opcional)</span>
        </label>
        <textarea
          className="input min-h-[100px] resize-none mb-5"
          placeholder="Ex: Semana do Dia das Mães (12/05), lançamento de coleção, promoção de aniversário..."
          value={context}
          onChange={e => onChangeContext(e.target.value)}
          autoFocus
        />

        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={onConfirm}
          >
            <Sparkles className="w-4 h-4" />
            Gerar 28 ideias
          </button>
        </div>
      </div>
    </div>
  )
}
