// src/types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_plan: 'free' | 'pro' | 'elite'
          usage_count: number
          monthly_usage_reset: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_plan?: 'free' | 'pro' | 'elite'
          usage_count?: number
          monthly_usage_reset?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_plan?: 'free' | 'pro' | 'elite'
          usage_count?: number
          monthly_usage_reset?: string
          created_at?: string
          updated_at?: string
        }
      }
      prompt_templates: {
        Row: {
          id: string
          agent_type: string
          version: string
          template_content: string
          variables: Json | null
          is_active: boolean
          performance_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          version: string
          template_content: string
          variables?: Json | null
          is_active?: boolean
          performance_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_type?: string
          version?: string
          template_content?: string
          variables?: Json | null
          is_active?: boolean
          performance_score?: number | null
          created_at?: string
        }
      }
      agent_sessions: {
        Row: {
          id: string
          user_id: string
          agent_type: string
          form_data: Json
          generated_prompt: string | null
          prompt_template_id: string | null
          status: 'active' | 'completed' | 'abandoned' | 'error'
          session_metadata: Json | null
          cost_cents: number
          created_at: string
          completed_at: string | null
          last_activity_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_type: string
          form_data: Json
          generated_prompt?: string | null
          prompt_template_id?: string | null
          status?: 'active' | 'completed' | 'abandoned' | 'error'
          session_metadata?: Json | null
          cost_cents?: number
          created_at?: string
          completed_at?: string | null
          last_activity_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_type?: string
          form_data?: Json
          generated_prompt?: string | null
          prompt_template_id?: string | null
          status?: 'active' | 'completed' | 'abandoned' | 'error'
          session_metadata?: Json | null
          cost_cents?: number
          created_at?: string
          completed_at?: string | null
          last_activity_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used: number | null
          response_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used?: number | null
          response_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          tokens_used?: number | null
          response_time_ms?: number | null
          created_at?: string
        }
      }
      session_feedback: {
        Row: {
          id: string
          session_id: string
          rating: number | null
          feedback_text: string | null
          would_recommend: boolean | null
          better_than_chatgpt: boolean | null
          improvement_suggestions: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          rating?: number | null
          feedback_text?: string | null
          would_recommend?: boolean | null
          better_than_chatgpt?: boolean | null
          improvement_suggestions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          rating?: number | null
          feedback_text?: string | null
          would_recommend?: boolean | null
          better_than_chatgpt?: boolean | null
          improvement_suggestions?: Json | null
          created_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          event_type: string
          event_data: Json | null
          cost_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          event_type: string
          event_data?: Json | null
          cost_cents?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          event_type?: string
          event_data?: Json | null
          cost_cents?: number
          created_at?: string
        }
      }
    }
  }
}