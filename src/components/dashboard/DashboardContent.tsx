// src/components/dashboard/DashboardContent.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Users,
  MessageCircle,
  Star,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

import { UserProfile, AgentSession } from '@/types/agents'

const availableAgents = [
  {
    id: 'arquitecto-decisiones',
    name: 'Arquitecto de Decisiones Estratégicas',
    description: 'Te ayudo a tomar decisiones complejas usando frameworks estructurados y metodologías probadas.',
    icon: Brain,
    color: 'bg-blue-500',
    features: ['Análisis estructurado', 'Frameworks probados', 'Contexto latino'],
    popular: true,
    href: '/arquitecto-decisiones'
  },
  // Futuros agentes...
  {
    id: 'experto-marketing',
    name: 'Experto en Marketing Digital',
    description: 'Estrategias de marketing digital adaptadas al mercado latinoamericano.',
    icon: TrendingUp,
    color: 'bg-green-500',
    features: ['SEO/SEM', 'Redes sociales', 'ROI optimizado'],
    comingSoon: true,
    href: '#'
  },
  {
    id: 'consultor-financiero',
    name: 'Consultor Financiero',
    description: 'Análisis financiero y planificación estratégica para emprendedores.',
    icon: Users,
    color: 'bg-purple-500',
    features: ['Cash flow', 'Inversiones', 'Financiamiento'],
    comingSoon: true,
    href: '#'
  }
]

interface DashboardContentProps {
  profile: UserProfile | null
  recentSessions: AgentSession[]
}

export function DashboardContent({ profile, recentSessions }: DashboardContentProps) {
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completada</Badge>
      case 'active':
        return <Badge variant="secondary">Activa</Badge>
      case 'abandoned':
        return <Badge variant="outline">Abandonada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const usagePercentage = profile ? (profile.usage_count / 100) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          ¡Hola{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Bienvenido a tu catálogo de agentes especializados. ¿En qué podemos ayudarte hoy?
        </p>
      </div>

      {/* Quick Stats */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile.usage_count}</p>
                  <p className="text-sm text-muted-foreground">Mensajes este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recentSessions.filter(s => s.status === 'completed').length}</p>
                  <p className="text-sm text-muted-foreground">Sesiones completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold capitalize">{profile.subscription_plan}</p>
                  <p className="text-sm text-muted-foreground">Plan actual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Progress */}
      {profile && profile.subscription_plan === 'free' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Uso del Plan Gratuito</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.usage_count} de 100 mensajes utilizados este mes
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Upgrade a Pro
                </Button>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              {usagePercentage > 80 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Te estás acercando al límite mensual. 
                      <Button variant="link" className="p-0 h-auto ml-1 text-amber-600">
                        Upgrade tu plan
                      </Button> para continuar usando todos los agentes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Agents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Agentes Especializados</h2>
          <Badge variant="secondary">
            {availableAgents.filter(a => !a.comingSoon).length} disponibles
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {availableAgents.map((agent, index) => {
            const Icon = agent.icon
            
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full ${agent.comingSoon ? 'opacity-60' : 'hover:shadow-lg transition-shadow cursor-pointer'}`}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className={`p-3 ${agent.color} rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          {agent.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                          {agent.comingSoon && (
                            <Badge variant="outline" className="text-xs">
                              Próximamente
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {agent.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {agent.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {agent.comingSoon ? (
                      <Button variant="outline" className="w-full" disabled>
                        Próximamente
                      </Button>
                    ) : (
                      <Button 
                        asChild 
                        className="w-full"
                        onClick={() => router.push(agent.href)}
                      >
                        <Link href={agent.href}>
                          Comenzar sesión
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Sesiones Recientes</h2>
            <Button variant="outline" asChild>
              <Link href="/historial">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {recentSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {session.agent_type === 'arquitecto-decisiones' && 'Arquitecto de Decisiones'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(session.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(session.status)}
                      
                      {session.status === 'active' ? (
                        <Button size="sm" asChild>
                          <Link href={`/arquitecto-decisiones/chat/${session.id}`}>
                            Continuar
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/arquitecto-decisiones/summary/${session.id}`}>
                            Ver resumen
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preview del contexto de la decisión */}
                  {session.form_data && typeof session.form_data === 'object' && 'contextoDecision' in session.form_data && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {(session.form_data as any).contextoDecision}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      {recentSessions.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">¡Comienza tu primera sesión!</h3>
                <p className="text-muted-foreground">
                  Selecciona un agente especializado para resolver tu desafío específico.
                </p>
              </div>
              <Button size="lg" asChild>
                <Link href="/arquitecto-decisiones">
                  <Brain className="h-5 w-5 mr-2" />
                  Probar Arquitecto de Decisiones
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">¿Necesitas ayuda?</h3>
              <p className="text-sm text-blue-700 mt-1">
                Nuestro equipo está aquí para ayudarte a sacar el máximo provecho de InnoTech Solutions.
              </p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                  Centro de ayuda
                </Button>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                  Contactar soporte
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}