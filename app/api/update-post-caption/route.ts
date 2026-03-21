// app/api/update-post-caption/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { postId, captionFinal } = await req.json()

    const { error } = await supabase
      .from('posts')
      .update({ caption_final: captionFinal, status: 'approved' })
      .eq('id', postId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('update-post-caption error:', err)
    return NextResponse.json({ error: 'Erro ao salvar legenda' }, { status: 500 })
  }
}
