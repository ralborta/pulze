'use client'

import { AppNav } from '@/components/AppNav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {children}
      </div>
      <AppNav />
    </div>
  )
}
