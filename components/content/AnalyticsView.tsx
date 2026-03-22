'use client'

// components/content/AnalyticsView.tsx
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, ChevronDown } from 'lucide-react'
import MetricsForm from './MetricsForm'
import AnalyticsReport from './AnalyticsReport'
import { getMonthName } from '@/lib/utils'
import { AnalyticsSnapshot } from '@/types'

interface Client { id: string; name: string; niche: string }

interface Props {
  clients: Client[]
  selectedClientId: string | null
  initialSnapshot: AnalyticsSnapshot | null
}

const now = new Date()
const CURRENT_MONTH = now.getMonth() + 1
const CURRENT_YEAR = now.getFullYear()

const MONTH_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(CURRENT_YEAR, CURRENT_MONTH - 1 - i, 1)
  return { month: d.getMonth() + 1, year: d.getFullYear() }
})

export default function AnalyticsView({ clients, selectedClientId, initialSnapshot }: Props) {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(initialSnapshot)
  const [showForm, setShowForm] = useState(!initialSnapshot)
  const [activeMonth, setActiveMonth] = useState(
    () => initialSnapshot?.month ?? CURRENT_MONTH
  )
  const [activeYear, setActiveYear] = useState(
    () => initialSnapshot?.year ?? CURRENT_YEAR
  )

  const selectedClient = clients.find(c => c.id === selectedClientId) ?? null

  // Sincroniza com a navegação de cliente (nova carga do servidor). Não depende de `initialSnapshot`
  // no array para evitar repor estado se o pai reenviar o mesmo dado com nova referência.
  useEffect(() => {
    setSnapshot(initialSnapshot)
    setShowForm(!initialSnapshot)
    if (initialSnapshot) {
      setActiveMonth(initialSnapshot.month)
      setActiveYear(initialSnapshot.year)
    } else {
      setActiveMonth(CURRENT_MONTH)
      setActiveYear(CURRENT_YEAR)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alinhar só a mudança de cliente/URL
  }, [selectedClientId])

  const handleMetricsSuccess = useCallback((newSnapshot: AnalyticsSnapshot) => {
    setSnapshot(newSnapshot)
    setShowForm(false)
  }, [])

  function handleClientChange(clientId: string) {
    setSnapshot(null)
    setShowForm(true)
    router.push(`/analytics?client=${clientId}`)
  }

  // Empty state — sem clientes
  if (clients.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="w-8 h-8 text-amber-400" />
        </div>
        <p className="font-semibold text-stone-900 mb-1">Nenhum cliente cadastrado</p>
        <p className="text-sm text-stone-500">Cadastre um cliente primeiro para analisar métricas</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Seletor de cliente */}
      <div>
        <label className="label">Cliente</label>
        <div className="relative">
          <select
            className="input appearance-none pr-10"
            value={selectedClientId ?? ''}
            onChange={e => handleClientChange(e.target.value)}
          >
            <option value="" disabled>Selecione um cliente...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        </div>
      </div>

      {/* Período só no fluxo de preenchimento — evita contradizer o mês do relatório já exibido */}
      {selectedClient && (showForm || !snapshot) && (
        <div>
          <label className="label">Período analisado</label>
          <div className="grid grid-cols-2 gap-2">
            {MONTH_OPTIONS.slice(0, 4).map(opt => {
              const isSelected = opt.month === activeMonth && opt.year === activeYear
              return (
                <button
                  key={`${opt.year}-${opt.month}`}
                  type="button"
                  onClick={() => {
                    setActiveMonth(opt.month)
                    setActiveYear(opt.year)
                  }}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-stone-200 text-stone-600 hover:border-amber-300'
                  }`}
                >
                  {getMonthName(opt.month)} {opt.year !== CURRENT_YEAR ? opt.year : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Formulário ou relatório */}
      {selectedClient && (
        <>
          {showForm || !snapshot ? (
            <MetricsForm
              key={`${selectedClientId}-${activeMonth}-${activeYear}`}
              client={selectedClient}
              month={activeMonth}
              year={activeYear}
              onSuccess={handleMetricsSuccess}
            />
          ) : (
            <AnalyticsReport
              snapshot={snapshot}
              clientName={selectedClient.name}
              onNewAnalysis={() => {
                setSnapshot(null)
                setShowForm(true)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
