// src/lib/openai/chat.ts
import { openai } from './client'
import { PromptManager } from '../prompts/prompt-manager'
import { generateArquitectoDecisionesPrompt } from '../prompts/arquitecto-decisiones'
import { ArquitectoDecisionesFormData } from '@/types/agents'

export interface ChatStreamOptions {
  sessionId: string
  userMessage: string
  formData?: ArquitectoDecisionesFormData
  onToken?: (token: string) => void
  onComplete?: (fullResponse: string, usage: any) => void
  onError?: (error: Error) => void
}

export class ChatService {
  private promptManager = new PromptManager()

  async createChatStream(options: ChatStreamOptions) {
    const { sessionId, userMessage, formData, onToken, onComplete, onError } = options

    try {
      let systemPrompt = ''
      
      // Si es la primera interacción y tenemos formData, usar prompt especializado
      if (formData) {
        systemPrompt = generateArquitectoDecisionesPrompt(formData)
      } else {
        // Usar prompt activo de la base de datos
        systemPrompt = await this.promptManager.getActivePrompt('arquitecto-decisiones')
      }

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userMessage }
      ]

      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      })

      let fullResponse = ''
      let totalTokens = 0

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          onToken?.(content)
        }

        // Tracking de usage (si está disponible)
        if (chunk.usage) {
          totalTokens = chunk.usage.total_tokens
        }
      }

      onComplete?.(fullResponse, { total_tokens: totalTokens })
      return fullResponse

    } catch (error) {
      console.error('Error in chat stream:', error)
      onError?.(error as Error)
      throw error
    }
  }

  async sendMessage(
    sessionId: string,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    formData?: ArquitectoDecisionesFormData
  ) {
    try {
      let systemPrompt = ''
      
      if (formData) {
        systemPrompt = generateArquitectoDecisionesPrompt(formData)
      } else {
        systemPrompt = await this.promptManager.getActivePrompt('arquitecto-decisiones')
      }

      const finalMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages
      ]

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: finalMessages,
        temperature: 0.7,
        max_tokens: 2000,
      })

      return {
        content: completion.choices[0].message.content,
        usage: completion.usage
      }

    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }
}