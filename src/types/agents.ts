// src/types/agents.ts
export interface ArquitectoDecisionesFormData {
  contextoDecision: string
  timeline: 'urgente' | '2-4-semanas' | '1-2-meses' | 'flexible'
  alternativas: string[]
  criterios: string[]
  informacionFaltante: string
  contextoPersonal?: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used?: number
  response_time_ms?: number
  created_at: string
}

export interface AgentSession {
  id: string
  user_id: string
  agent_type: string
  form_data: ArquitectoDecisionesFormData
  generated_prompt?: string
  status: 'active' | 'completed' | 'abandoned' | 'error'
  cost_cents: number
  created_at: string
  completed_at?: string
  messages?: ChatMessage[]
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_plan: 'free' | 'pro' | 'elite'
  usage_count: number
  monthly_usage_reset: string
}