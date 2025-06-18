// src/lib/prompts/prompt-manager.ts
import { createClient } from '@/lib/supabase/client'

export class PromptManager {
  private supabase = createClient()

  async getActivePrompt(agentType: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('prompt_templates')
        .select('template_content')
        .eq('agent_type', agentType)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data.template_content
    } catch (error) {
      console.error('Error fetching prompt template:', error)
      // Fallback a prompt hardcodeado
      return this.getFallbackPrompt(agentType)
    }
  }

  async createPromptVersion(
    agentType: string,
    version: string,
    templateContent: string,
    variables?: any
  ) {
    try {
      const { data, error } = await this.supabase
        .from('prompt_templates')
        .insert({
          agent_type: agentType,
          version,
          template_content: templateContent,
          variables,
          is_active: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating prompt version:', error)
      throw error
    }
  }

  async activatePromptVersion(id: string, agentType: string) {
    try {
      // Desactivar versión actual
      await this.supabase
        .from('prompt_templates')
        .update({ is_active: false })
        .eq('agent_type', agentType)

      // Activar nueva versión
      const { data, error } = await this.supabase
        .from('prompt_templates')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error activating prompt version:', error)
      throw error
    }
  }

  private getFallbackPrompt(agentType: string): string {
    // Prompts de respaldo hardcodeados
    const fallbackPrompts = {
      'arquitecto-decisiones': `Eres un experto consultor en toma de decisiones estratégicas. 
      Ayuda al usuario a analizar su situación de manera estructurada y metódica, 
      proporcionando un framework claro para evaluar sus opciones.`
    }

    return fallbackPrompts[agentType as keyof typeof fallbackPrompts] || 
           'Eres un asistente especializado. Ayuda al usuario con su consulta.'
  }
}