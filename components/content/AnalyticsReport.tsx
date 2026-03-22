'use client'

// components/content/AnalyticsReport.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Copy, Check, TrendingUp, AlertCircle, Eye, Lightbulb,
  FileText, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'
import { getMonthName } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { AnalyticsSnapshot } from '@/types'

interface Props {
  snapshot: AnalyticsSnapshot
  clientName: string
  onNewAnalysis: () => void
}

export default function AnalyticsReport({ snapshot, clientName, onNewAnalysis }: Props) {
  const [copied, setCopied] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['highlights', 'recommendations', 'executive_summary'])
  )

  async function copyExecutiveSummary() {
    await navigator.clipboard.writeText(snapshot.executive_summary)
    setCopied(true)
    toast.success('Resumo copiado! Pronto para enviar ao cliente.')
    setTimeout(() => setCopied(false), 3000)
  }

  function toggleSection(key: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function Section({
    id, icon: Icon, title, color, items, emptyText,
  }: {
    id: string
    icon: React.ElementType
    title: string
    color: string
    items: string[]
    emptyText: string
  }) {
    const isOpen = openSections.has(id)
    return (
      <div className="card overflow-hidden">
        <button
          className="w-full flex items-center gap-3 p-4 text-left"
          onClick={() => toggleSection(id)}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="font-semibold text-stone-900 text-sm flex-1">{title}</p>
          <span className="text-xs text-stone-400 mr-1">{items.length}</span>
          {isOpen
            ? <ChevronUp className="w-4 h-4 text-stone-400" />
            : <ChevronDown className="w-4 h-4 text-stone-400" />
          }
        </button>

        {isOpen && (
          <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-2">
            {items.length > 0 ? items.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-stone-700 leading-relaxed">{item}</p>
              </div>
            )) : (
              <p className="text-sm text-stone-400 italic">{emptyText}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Header do relatório */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-stone-900 text-sm">{clientName}</p>
          <p className="text-xs text-stone-400">
            {getMonthName(snapshot.month)} {snapshot.year}
          </p>
        </div>
        <button
          className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
          onClick={onNewAnalysis}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Nova análise
        </button>
      </div>

      {/* Resumo executivo — destaque principal */}
      <div className="card overflow-hidden">
        <button
          className="w-full flex items-center gap-3 p-4 text-left"
          onClick={() => toggleSection('executive_summary')}
        >
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-amber-700" />
          </div>
          <p className="font-semibold text-stone-900 text-sm flex-1">Resumo para o cliente</p>
          {openSections.has('executive_summary')
            ? <ChevronUp className="w-4 h-4 text-stone-400" />
            : <ChevronDown className="w-4 h-4 text-stone-400" />
          }
        </button>

        {openSections.has('executive_summary') && (
          <div className="border-t border-stone-100 p-4">
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line mb-4">
              {snapshot.executive_summary}
            </p>
            <button
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all',
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              )}
              onClick={copyExecutiveSummary}
            >
              {copied
                ? <><Check className="w-4 h-4" />Copiado! Pronto para enviar</>
                : <><Copy className="w-4 h-4" />Copiar para enviar ao cliente</>
              }
            </button>
          </div>
        )}
      </div>

      {/* Seções do relatório */}
      <Section
        id="highlights"
        icon={TrendingUp}
        title="Destaques do mês"
        color="bg-green-50 text-green-600"
        items={snapshot.highlights}
        emptyText="Nenhum destaque identificado"
      />

      <Section
        id="opportunities"
        icon={AlertCircle}
        title="Oportunidades de melhoria"
        color="bg-orange-50 text-orange-600"
        items={snapshot.opportunities}
        emptyText="Nenhuma oportunidade identificada"
      />

      <Section
        id="patterns"
        icon={Eye}
        title="Padrões da audiência"
        color="bg-blue-50 text-blue-600"
        items={snapshot.patterns}
        emptyText="Nenhum padrão identificado"
      />

      <Section
        id="recommendations"
        icon={Lightbulb}
        title="Recomendações para o próximo mês"
        color="bg-violet-50 text-violet-600"
        items={snapshot.recommendations}
        emptyText="Nenhuma recomendação gerada"
      />

    </div>
  )
}
