// types/index.ts

export interface Client {
  id: string
  user_id: string
  name: string
  niche: string
  instagram_handle: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface ClientProfile {
  id: string
  client_id: string
  persona: {
    demographics: string
    psychographics: string
    pain_points: string[]
    desires: string[]
    language_they_use: string[]
  }
  pillars: Array<{
    name: string
    description: string
    examples: string[]
  }>
  tone_guidelines: string
  content_opportunities: string
  references_analysis: string
  raw_briefing: string
  updated_at: string
}

export interface ContentIdea {
  week: number
  title: string
  format: string
  platform: string
  hook: string
  objective: string
}

export interface ContentPlan {
  id: string
  client_id: string
  month: number
  year: number
  status: 'generating' | 'ready' | 'active'
  generated_ideas: ContentIdea[]
  approved_ideas: ContentIdea[]
  month_context: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  content_plan_id: string
  client_id: string
  idea: ContentIdea
  caption_draft: string
  caption_final: string | null
  hashtags: string[]
  stories_version: string | null
  visual_brief: string
  caption_variations: string[]
  image_url: string | null
  scheduled_for: string | null
  status: 'draft' | 'approved' | 'rejected' | 'scheduled' | 'posted'
  created_at: string
  updated_at: string
}

export interface AnalyticsSnapshot {
  id: string
  client_id: string
  month: number
  year: number
  raw_data: Record<string, unknown>
  highlights: string[]
  opportunities: string[]
  patterns: string[]
  recommendations: string[]
  executive_summary: string
  captured_at: string
}

export interface ClientWithProfile extends Client {
  client_profiles: ClientProfile[]
}
