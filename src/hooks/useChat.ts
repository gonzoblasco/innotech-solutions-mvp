// src/hooks/useChat.ts
import { useState, useCallback } from 'react'
import { ChatMessage } from '@/types/agents'

interface UseChatOptions {
  sessionId: string
  onError?: (error: string) => void
  onMessageSent?: (message: ChatMessage) => void
  onMessageReceived?: (message: ChatMessage) => void
}

export function useChat({ sessionId, onError, onMessageSent, onMessageReceived }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')

  const sendMessage = useCallback(async (content: string, isFirstMessage = false) => {
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    setStreamingMessage('')

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    onMessageSent?.(userMessage)

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: content.trim(),
          isFirstMessage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error enviando mensaje')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No se pudo crear el stream reader')

      let assistantMessage = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.token) {
                assistantMessage += data.token
                setStreamingMessage(assistantMessage)
              } else if (data.complete) {
                const finalMessage: ChatMessage = {
                  id: `assistant-${Date.now()}`,
                  session_id: sessionId,
                  role: 'assistant',
                  content: assistantMessage,
                  tokens_used: data.usage?.total_tokens,
                  created_at: new Date().toISOString(),
                }

                setMessages(prev => [...prev, finalMessage])
                setStreamingMessage('')
                onMessageReceived?.(finalMessage)
              } else if (data.error) {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      onError?.(error.message)
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
      setStreamingMessage('')
    }
  }, [sessionId, isLoading, onError, onMessageSent, onMessageReceived])

  const regenerateLastResponse = useCallback(() => {
    if (messages.length < 2) return

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find(m => m.role === 'user')

    if (!lastUserMessage) return

    // Remove last assistant response
    setMessages(prev => prev.filter(m => 
      !(m.role === 'assistant' && m.created_at > lastUserMessage.created_at)
    ))

    // Resend the last user message
    sendMessage(lastUserMessage.content)
  }, [messages, sendMessage])

  return {
    messages,
    setMessages,
    isLoading,
    streamingMessage,
    sendMessage,
    regenerateLastResponse,
  }
}