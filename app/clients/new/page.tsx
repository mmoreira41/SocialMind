// app/clients/new/page.tsx
'use client'

export const dynamic = 'force-dynamic'

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
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState<FormData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const router   = useRouter()
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
              n < step  ? 'bg-brand-600 text-white' :
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
            <p className="text-sm text-surface-500">Qual o nome da marca e em que área atua?</p>
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
