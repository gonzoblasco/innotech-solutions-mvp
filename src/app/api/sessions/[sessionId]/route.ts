// src/app/api/sessions/[sessionId]/route.ts - Actualizada
import { NextRequest, NextResponse } from 'next/server'
import { createServerClientAction } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createServerClientAction()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener sesión con mensajes
    const { data: session, error: sessionError } = await supabase
      .from('agent_sessions')
      .select(`
        *,
        chat_messages (
          id,
          role,
          content,
          tokens_used,
          response_time_ms,
          created_at
        )
      `)
      .eq('id', params.sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ session })

  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { status } = await request.json()
    const supabase = createServerClientAction()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('agent_sessions')
      .update({ 
        status,
        ...(status === 'completed' && { completed_at: new Date().toISOString() })
      })
      .eq('id', params.sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error actualizando sesión' }, { status: 500 })
    }

    return NextResponse.json({ session: data })

  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}