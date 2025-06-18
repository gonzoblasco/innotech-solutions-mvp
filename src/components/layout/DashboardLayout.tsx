// src/components/layout/DashboardLayout.tsx
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Brain, 
  User, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Crown,
  HelpCircle,
  MessageCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useAuth } from '@/components/auth/AuthProvider'

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Brain,
    description: 'Vista general y agentes disponibles'
  },
  { 
    name: 'Arquitecto de Decisiones', 
    href: '/arquitecto-decisiones', 
    icon: Brain,
    description: 'Análisis estructurado de decisiones complejas',
    featured: true
  },
  { 
    name: 'Historial', 
    href: '/historial', 
    icon: History,
    description: 'Tus sesiones anteriores'
  },
  { 
    name: 'Perfil', 
    href: '/perfil', 
    icon: User,
    description: 'Configuración de cuenta'
  },
]

const planFeatures = {
  free: {
    name: 'Gratuito',
    limit: 100,
    agents: 3,
    color: 'bg-gray-500'
  },
  pro: {
    name: 'Pro',
    limit: 1000,
    agents: 'Todos',
    color: 'bg-blue-500'
  },
  elite: {
    name: 'Elite',
    limit: 2000,
    agents: 'Todos + Avanzados',
    color: 'bg-purple-500'
  }
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const planInfo = profile ? planFeatures[profile.subscription_plan] : planFeatures.free
  const usagePercentage = profile ? (profile.usage_count / planInfo.limit) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-4 border-b">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">InnoTech</h1>
              <p className="text-xs text-muted-foreground">Solutions</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                              (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.name}
                        {item.featured && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                      </div>
                      <p className="text-xs opacity-70 mt-0.5">{item.description}</p>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Plan Usage */}
          {profile && (
            <div className="px-4 pb-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${planInfo.color}`} />
                      <span className="font-medium text-sm">Plan {planInfo.name}</span>
                    </div>
                    {profile.subscription_plan !== 'elite' && (
                      <Button variant="outline" size="sm" className="h-6 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Uso mensual</span>
                      <span>{profile.usage_count} / {planInfo.limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${planInfo.color}`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User menu */}
          <div className="px-4 py-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{profile?.full_name || 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/perfil')}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/configuracion')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ayuda
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden lg:block">
              {/* Breadcrumb aquí si es necesario */}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Soporte
              </Button>
              
              {profile?.subscription_plan === 'free' && (
                <Button size="sm" className="hidden sm:flex">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrader Plan
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
