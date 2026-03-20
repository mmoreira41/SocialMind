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
