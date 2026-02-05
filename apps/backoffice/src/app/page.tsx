'use client'

import { Users, Activity, TrendingUp, MessageSquare, Settings, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function BackofficePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-green-500" />
              <span className="ml-2 text-xl font-bold">PULZE Backoffice</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Admin</span>
              <Settings className="w-5 h-5 text-gray-400 cursor-pointer" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Usuarios Totales"
            value="1,234"
            change="+12%"
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Usuarios Activos"
            value="856"
            change="+8%"
            icon={<Activity className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Check-ins Hoy"
            value="432"
            change="+15%"
            icon={<MessageSquare className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Retención 7d"
            value="78%"
            change="+3%"
            icon={<TrendingUp className="w-6 h-6" />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Usuarios Recientes</h2>
            <div className="space-y-4">
              <UserRow name="María González" phone="+54 9 11 1234-5678" status="Activo" streak={7} />
              <UserRow name="Juan Pérez" phone="+54 9 11 8765-4321" status="Activo" streak={12} />
              <UserRow name="Ana Martínez" phone="+54 9 11 2345-6789" status="Inactivo" streak={3} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <QuickAction icon={<Users />} title="Gestionar Usuarios" href="/users" />
              <QuickAction icon={<MessageSquare />} title="Plantillas" href="/templates" />
              <QuickAction icon={<BarChart3 />} title="Reportes" href="/reports" />
              <QuickAction icon={<Settings />} title="Configuración" href="/settings" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  color 
}: { 
  title: string
  value: string
  change: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-green-600">{change}</span>
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function UserRow({ 
  name, 
  phone, 
  status, 
  streak 
}: { 
  name: string
  phone: string
  status: string
  streak: number
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-sm text-gray-500">{phone}</p>
      </div>
      <div className="text-right">
        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
          status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
        <p className="text-sm text-gray-600 mt-1">🔥 {streak} días</p>
      </div>
    </div>
  )
}

function QuickAction({ 
  icon, 
  title, 
  href 
}: { 
  icon: React.ReactNode
  title: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
    >
      <div className="text-gray-600">{icon}</div>
      <span className="font-medium text-gray-900">{title}</span>
    </Link>
  )
}
