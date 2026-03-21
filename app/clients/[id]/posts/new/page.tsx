// app/clients/[id]/posts/new/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import PostGenerator from '@/components/content/PostGenerator'
import { ContentIdea } from '@/types'

export default async function NewPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ planId?: string; ideaId?: string }>
}) {
  const { id } = await params
  const { planId, ideaId } = await searchParams

  if (!planId || !ideaId) redirect(`/clients/${id}/plan`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: plan } = await supabase
    .from('content_plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (!plan) notFound()

  const idea = (plan.generated_ideas as ContentIdea[])?.find(i => i.id === ideaId)
  if (!idea) notFound()

  const { data: existingPost } = await supabase
    .from('posts')
    .select('*')
    .eq('content_plan_id', planId)
    .eq('client_id', id)
    .filter('idea->>id', 'eq', ideaId)
    .maybeSingle()

  return (
    <div className="page-container">
      <Header title="Gerar post" subtitle={idea.title} showBack />
      <PostGenerator
        clientId={id}
        planId={planId}
        idea={idea}
        existingPost={existingPost ?? null}
      />
    </div>
  )
}
