// src/app/(dashboard)/dashboard/page.tsx - Actualizada
import { createServerClientComponent } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const supabase = createServerClientComponent()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Cargar datos del usuario y sesiones recientes
  const [profileResult, sessionsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    
    supabase
      .from('agent_sessions')
      .select(`
        id,
        agent_type,
        status,
        created_at,
        completed_at,
        form_data
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  const profile = profileResult.data
  const recentSessions = sessionsResult.data || []

  return (
    <DashboardContent 
      profile={profile} 
      recentSessions={recentSessions} 
    />
  )
}