'use client'

import { Users, Activity, TrendingUp, MessageSquare, Flame, Clock } from 'lucide-react'

export default function BackofficePage() {
  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">Dashboard</h1>
        <p className="text-gray-400">Vista general de la plataforma PULZE</p>
      </header>

      {/* Stats Grid */}
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
        {/* Recent Users */}
        <div className="lg:col-span-2 glass rounded-3xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-white">Usuarios Recientes</h2>
          <div className="space-y-4">
            <UserRow 
              name="María González" 
              phone="+54 9 11 1234-5678" 
              status="Activo" 
              streak={7}
              email="maria@example.com"
            />
            <UserRow 
              name="Juan Pérez" 
              phone="+54 9 11 8765-4321" 
              status="Activo" 
              streak={12}
              email="juan@example.com"
            />
            <UserRow 
              name="Ana Martínez" 
              phone="+54 9 11 2345-6789" 
              status="Inactivo" 
              streak={3}
              email="ana@example.com"
            />
            <UserRow 
              name="Carlos Ruiz" 
              phone="+54 9 11 3456-7890" 
              status="Activo" 
              streak={5}
              email="carlos@example.com"
            />
          </div>

          <button className="mt-6 w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-medium transition">
            Ver todos los usuarios
          </button>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Engagement */}
          <div className="glass rounded-3xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Engagement
            </h2>
            <div className="space-y-4">
              <MetricRow label="Racha promedio" value="6.5 días" />
              <MetricRow label="Check-ins/usuario" value="4.2/semana" />
              <MetricRow label="Tiempo respuesta" value="< 2 min" />
            </div>
          </div>

          {/* Activity Today */}
          <div className="glass rounded-3xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Hoy
            </h2>
            <div className="space-y-4">
              <MetricRow label="Nuevos usuarios" value="23" />
              <MetricRow label="Check-ins completados" value="432" />
              <MetricRow label="Mensajes enviados" value="1,245" />
            </div>
          </div>
        </div>
      </div>
    </>
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
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 hover:border-cyan-500/30 transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-green-400">{change}</span>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function UserRow({ 
  name, 
  phone, 
  email,
  status, 
  streak 
}: { 
  name: string
  phone: string
  email: string
  status: string
  streak: number
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">{name[0]}</span>
        </div>
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-sm text-gray-400">{email}</p>
          <p className="text-xs text-gray-500">{phone}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
          status === 'Activo' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          {status}
        </span>
        <p className="text-sm text-orange-400 mt-2 flex items-center gap-1 justify-end">
          <Flame className="w-4 h-4" />
          {streak} días
        </p>
      </div>
    </div>
  )
}

function MetricRow({ 
  label, 
  value 
}: { 
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}
