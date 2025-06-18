// src/app/(dashboard)/arquitecto-decisiones/chat/[sessionId]/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/chat/ChatInterface'

interface PageProps {
  params: {
    sessionId: string
  }
}

export default async function ChatPage({ params }: PageProps) {
  const supabase = createServerClient()
  
  // Verificar autenticación
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Verificar que la sesión existe y pertenece al usuario
  const { data: session, error: sessionError } = await supabase
    .from('agent_sessions')
    .select('id, status')
    .eq('id', params.sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ChatInterface sessionId={params.sessionId} />
    </div>
  )
}