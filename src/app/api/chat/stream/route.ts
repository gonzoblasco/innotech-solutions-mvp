// src/app/api/chat/stream/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ChatService } from '@/lib/openai/chat'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, isFirstMessage } = await request.json()

    // Verificar autenticación
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener sesión y verificar ownership
    const { data: session, error: sessionError } = await supabase
      .from('agent_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // Verificar límites de uso
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_plan, usage_count')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Error verificando perfil' }, { status: 500 })
    }

    const usageLimit = profile.subscription_plan === 'free' ? 100 : 
                      profile.subscription_plan === 'pro' ? 1000 : 2000

    if (profile.usage_count >= usageLimit) {
      return NextResponse.json({ 
        error: 'Límite de uso alcanzado',
        type: 'usage_limit'
      }, { status: 403 })
    }

    // Guardar mensaje del usuario
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      })

    if (userMsgError) {
      return NextResponse.json({ error: 'Error guardando mensaje' }, { status: 500 })
    }

    // Crear stream response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const chatService = new ChatService()
        
        try {
          let fullResponse = ''
          let usage: any = null

          await chatService.createChatStream({
            sessionId,
            userMessage: message,
            formData: isFirstMessage ? session.form_data : undefined,
            onToken: (token) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
            },
            onComplete: async (response, responseUsage) => {
              fullResponse = response
              usage = responseUsage

              // Guardar respuesta del asistente
              await supabase
                .from('chat_messages')
                .insert({
                  session_id: sessionId,
                  role: 'assistant',
                  content: fullResponse,
                  tokens_used: usage?.total_tokens || 0,
                })

              // Actualizar contador de uso
              await supabase
                .from('user_profiles')
                .update({ 
                  usage_count: profile.usage_count + 1 
                })
                .eq('id', user.id)

              // Actualizar actividad de la sesión
              await supabase
                .from('agent_sessions')
                .update({ 
                  last_activity_at: new Date().toISOString(),
                  cost_cents: (session.cost_cents || 0) + Math.round((usage?.total_tokens || 0) * 0.002)
                })
                .eq('id', sessionId)

              // Log de analytics
              await supabase
                .from('usage_logs')
                .insert({
                  user_id: user.id,
                  session_id: sessionId,
                  event_type: 'chat_message',
                  event_data: { 
                    tokens_used: usage?.total_tokens || 0,
                    is_first_message: isFirstMessage 
                  },
                  cost_cents: Math.round((usage?.total_tokens || 0) * 0.002)
                })

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                complete: true, 
                usage: usage 
              })}\n\n`))
              controller.close()
            },
            onError: (error) => {
              console.error('Chat stream error:', error)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                error: 'Error procesando respuesta' 
              })}\n\n`))
              controller.close()
            }
          })
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: 'Error interno del servidor' 
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}