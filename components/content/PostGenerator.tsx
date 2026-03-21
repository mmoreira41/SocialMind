// components/content/PostGenerator.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { ContentIdea, Post } from '@/types'
import { cn, FORMAT_LABELS, OBJECTIVE_LABELS, OBJECTIVE_COLORS } from '@/lib/utils'

interface Props {
  clientId: string
  planId: string
  idea: ContentIdea
  existingPost: Post | null
}

export default function PostGenerator({ clientId, planId, idea, existingPost }: Props) {
  const [post, setPost]           = useState<Post | null>(existingPost)
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [copied, setCopied]       = useState<string | null>(null)
  const [showStories, setShowStories]         = useState(false)
  const [showBrief, setShowBrief]             = useState(false)
  const [showVariations, setShowVariations]   = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Legenda gerada aparecerá aqui...' }),
    ],
    content: existingPost?.caption_final || existingPost?.caption_draft || '',
    editorProps: {
      attributes: {
        class: 'min-h-[180px] p-4 text-sm text-surface-800 leading-relaxed focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      setPost(p => p ? { ...p, caption_final: editor.getText() } : p)
    },
  })

  useEffect(() => {
    if (post && editor && !editor.isDestroyed) {
      const content = post.caption_final || post.caption_draft
      if (content && editor.getText() !== content) {
        editor.commands.setContent(content)
      }
    }
  }, [post?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, contentPlanId: planId, idea }),
      })
      if (!res.ok) throw new Error()
      const { post: newPost } = await res.json()
      setPost(newPost)
      editor?.commands.setContent(newPost.caption_draft)
      toast.success('Post gerado!')
    } catch {
      toast.error('Erro ao gerar post.')
    } finally {
      setLoading(false)
    }
  }

  async function saveCaption() {
    if (!post) return
    setSaving(true)
    try {
      const caption = editor?.getText() || post.caption_draft
      const res = await fetch('/api/update-post-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, captionFinal: caption }),
      })
      if (!res.ok) throw new Error()
      setPost(p => p ? { ...p, caption_final: caption } : p)
      toast.success('Legenda salva!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Copiado!')
    setTimeout(() => setCopied(null), 2000)
  }

  function CopyBtn({ text, id }: { text: string; id: string }) {
    return (
      <button
        onClick={() => copy(text, id)}
        className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-amber-600 transition-colors"
      >
        {copied === id
          ? <><Check className="w-3.5 h-3.5 text-green-500" />Copiado</>
          : <><Copy className="w-3.5 h-3.5" />Copiar</>
        }
      </button>
    )
  }

  return (
    <div className="space-y-4">

      {/* Info da ideia */}
      <div className="card p-4">
        <p className="font-display font-semibold text-surface-900 text-sm mb-2">{idea.title}</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={cn('badge text-xs', OBJECTIVE_COLORS[idea.objective] ?? 'bg-surface-100 text-surface-500')}>
            {OBJECTIVE_LABELS[idea.objective] ?? idea.objective}
          </span>
          <span className="badge bg-surface-100 text-surface-500 text-xs">
            {FORMAT_LABELS[idea.format] ?? idea.format}
          </span>
          <span className="badge bg-surface-100 text-surface-500 text-xs capitalize">
            {idea.platform}
          </span>
        </div>
        {idea.hook && (
          <p className="text-xs text-surface-400 italic">Hook: &ldquo;{idea.hook}&rdquo;</p>
        )}
      </div>

      {/* Sem post ainda */}
      {!post && (
        <div className="text-center py-8">
          <button
            className="btn-primary flex items-center gap-2 mx-auto"
            onClick={generate}
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</>
              : <><Sparkles className="w-4 h-4" />Gerar post</>
            }
          </button>
          <p className="text-xs text-surface-400 mt-3">Leva cerca de 15 segundos</p>
        </div>
      )}

      {/* Post gerado */}
      {post && (
        <>
          {/* Editor de legenda */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Legenda</label>
              <CopyBtn text={editor?.getText() || post.caption_draft} id="caption" />
            </div>
            <div className="card overflow-hidden">
              <EditorContent editor={editor} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <button
                className="text-xs text-surface-400 hover:text-amber-600 transition-colors flex items-center gap-1.5"
                onClick={generate}
                disabled={loading}
              >
                {loading
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Sparkles className="w-3 h-3" />
                }
                Regenerar
              </button>
              <button
                className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
                onClick={saveCaption}
                disabled={saving}
              >
                {saving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Check className="w-3.5 h-3.5" />
                }
                Salvar
              </button>
            </div>
          </div>

          {/* Hashtags */}
          {post.hashtags?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Hashtags</label>
                <CopyBtn
                  text={post.hashtags.map(h => `#${h}`).join(' ')}
                  id="hashtags"
                />
              </div>
              <div className="card p-3 flex flex-wrap gap-1.5">
                {post.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: '#fff7ed', color: '#d97706' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Briefing visual */}
          {post.visual_brief && (
            <div>
              <button
                className="w-full flex items-center justify-between py-2"
                onClick={() => setShowBrief(v => !v)}
              >
                <label className="label mb-0 cursor-pointer">Briefing visual</label>
                {showBrief
                  ? <ChevronUp className="w-4 h-4 text-surface-400" />
                  : <ChevronDown className="w-4 h-4 text-surface-400" />
                }
              </button>
              {showBrief && (
                <div className="card p-4">
                  <div className="flex justify-end mb-2">
                    <CopyBtn text={post.visual_brief} id="brief" />
                  </div>
                  <p className="text-sm text-surface-600 whitespace-pre-line leading-relaxed">
                    {post.visual_brief}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stories */}
          {post.stories_version && (
            <div>
              <button
                className="w-full flex items-center justify-between py-2"
                onClick={() => setShowStories(v => !v)}
              >
                <label className="label mb-0 cursor-pointer">Versão stories</label>
                {showStories
                  ? <ChevronUp className="w-4 h-4 text-surface-400" />
                  : <ChevronDown className="w-4 h-4 text-surface-400" />
                }
              </button>
              {showStories && (
                <div className="space-y-2">
                  {post.stories_version.split('---').map((slide, i) => (
                    <div key={i} className="card p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-surface-400">Slide {i + 1}</span>
                        <CopyBtn text={slide.trim()} id={`slide-${i}`} />
                      </div>
                      <p className="text-sm text-surface-700">{slide.trim()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Variações */}
          {post.caption_variations?.length > 0 && (
            <div>
              <button
                className="w-full flex items-center justify-between py-2"
                onClick={() => setShowVariations(v => !v)}
              >
                <label className="label mb-0 cursor-pointer">Variações de legenda</label>
                {showVariations
                  ? <ChevronUp className="w-4 h-4 text-surface-400" />
                  : <ChevronDown className="w-4 h-4 text-surface-400" />
                }
              </button>
              {showVariations && (
                <div className="space-y-2">
                  {post.caption_variations.map((variation, i) => (
                    <div key={i} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-surface-400">Variação {i + 1}</span>
                        <div className="flex gap-3">
                          <CopyBtn text={variation} id={`var-${i}`} />
                          <button
                            className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                            onClick={() => {
                              editor?.commands.setContent(variation)
                              setPost(p => p ? { ...p, caption_final: variation } : p)
                              toast.info('Variação aplicada ao editor')
                            }}
                          >
                            Usar esta
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-surface-600 leading-relaxed">{variation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
