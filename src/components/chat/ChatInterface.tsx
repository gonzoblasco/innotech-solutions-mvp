// src/components/chat/ChatInterface.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  RefreshCw, 
  Download, 
  Star, 
  MessageCircle, 
  Brain,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import { useAuth } from '@/components/auth/AuthProvider'
import { ChatMessage, AgentSession } from '@/types/agents'

interface ChatInterfaceProps {
  sessionId: string
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [session, setSession] = useState<AgentSession | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const { user, profile } = useAuth()

  // Cargar sesión y mensajes
  useEffect(() => {
    loadSession()
  }, [sessionId])

  // Auto-scroll al final
  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const loadSession = async () => {
    try {
      setIsLoadingSession(true)
      const response = await fetch(`/api/sessions/${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Error cargando sesión')
      }

      const data = await response.json()
      setSession(data.session)
      setMessages(data.session.chat_messages || [])
      setIsFirstMessage(data.session.chat_messages?.length === 0)
    } catch (error) {
      console.error('Error loading session:', error)
      setError('Error cargando la sesión')
    } finally {
      setIsLoadingSession(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setError(null)
    setStreamingMessage('')

    // Agregar mensaje del usuario inmediatamente
    const newUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
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
                // Streaming completado
                const finalAssistantMessage: ChatMessage = {
                  id: `assistant-${Date.now()}`,
                  session_id: sessionId,
                  role: 'assistant',
                  content: assistantMessage,
                  tokens_used: data.usage?.total_tokens,
                  created_at: new Date().toISOString(),
                }

                setMessages(prev => [...prev, finalAssistantMessage])
                setStreamingMessage('')
                setIsFirstMessage(false)
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
      setError(error.message)
      // Remover el mensaje del usuario si hubo error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
      setStreamingMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const regenerateLastResponse = async () => {
    if (messages.length < 2) return

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find(m => m.role === 'user')

    if (!lastUserMessage) return

    // Remover la última respuesta del asistente
    setMessages(prev => prev.filter(m => 
      !(m.role === 'assistant' && m.created_at > lastUserMessage.created_at)
    ))

    setInput(lastUserMessage.content)
    await sendMessage()
  }

  const completSession = async () => {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      
      router.push(`/arquitecto-decisiones/summary/${sessionId}`)
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Acceso requerido</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/login')} className="w-full">
            Iniciar sesión
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sesión no encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Volver al dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Arquitecto de Decisiones Estratégicas</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sesión iniciada {new Date(session.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                {session.status === 'completed' ? 'Completada' : 'Activa'}
              </Badge>
              
              {session.status !== 'completed' && messages.length > 2 && (
                <Button onClick={completSession} variant="outline" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar sesión
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Area */}
      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Mensaje inicial del sistema */}
              {messages.length === 0 && !streamingMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%] bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Arquitecto de Decisiones</span>
                    </div>
                    <p className="text-sm">
                      ¡Hola! He analizado tu situación basándome en la información que proporcionaste. 
                      Estoy listo para ayudarte a estructurar esta decisión paso a paso. 
                      ¿Por dónde te gustaría comenzar?
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Mensajes existentes */}
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Arquitecto de Decisiones</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatTimestamp(message.created_at)}
                          </span>
                        </div>
                      )}
                      
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="text-xs opacity-70 mt-2 text-right">
                          {formatTimestamp(message.created_at)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Mensaje streaming */}
              {streamingMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%] bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Arquitecto de Decisiones</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{streamingMessage}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Error Alert */}
          {error && (
            <div className="p-4 border-t">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu pregunta o comentario..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-[60px] w-[60px]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                
                {messages.length > 0 && !isLoading && (
                  <Button
                    onClick={regenerateLastResponse}
                    variant="outline"
                    size="icon"
                    title="Regenerar última respuesta"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Usage info */}
            {profile && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>
                  Plan: <span className="font-medium capitalize">{profile.subscription_plan}</span>
                </span>
                <span>
                  Uso: {profile.usage_count}
                  {profile.subscription_plan === 'free' && ' / 100'}
                  {profile.subscription_plan === 'pro' && ' / 1000'}
                  {profile.subscription_plan === 'elite' && ' / 2000'} mensajes
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {messages.length > 2 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Acciones rápidas</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar conversación
                </Button>
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Guardar análisis
                </Button>
                {session.status !== 'completed' && (
                  <Button onClick={completSession} size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar y calificar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
