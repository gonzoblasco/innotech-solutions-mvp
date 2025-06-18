// src/app/(dashboard)/layout.tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AuthProvider } from '@/components/auth/AuthProvider'

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AuthProvider>
  )
}
