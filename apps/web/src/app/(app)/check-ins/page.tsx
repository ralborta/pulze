'use client'

import { CalendarCheck, TrendingUp, Award, Calendar } from 'lucide-react'

export default function CheckInsPage() {
  return (
    <>
      {/* Header */}
      <header className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center glow-cyan">
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gradient mb-1">Check-ins</h1>
        <p className="text-cyan-300 text-sm">Tu historial de progreso</p>
      </header>

      <div className="space-y-4">
        {/* Current Week */}
        <div className="glass rounded-3xl p-6 glow-cyan">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Esta Semana</h2>
            <div className="bg-cyan-500/10 px-3 py-1 rounded-full">
              <span className="text-cyan-400 text-sm font-semibold">0/7</span>
            </div>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
              <div key={i} className="text-center">
                <div className="text-xs text-gray-400 mb-2">{day}</div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-gray-700 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">–</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-xs text-blue-300 text-center">
              💬 Enviá &quot;checkin&quot; a WhatsApp para registrar tu día
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Resumen General</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              label="Total Check-ins"
              value="0"
              color="green"
            />
            <StatCard
              icon={<Award className="w-5 h-5 text-yellow-400" />}
              label="Mejor Racha"
              value="0 días"
              color="yellow"
            />
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
            <p className="text-sm text-gray-300 text-center">
              Tus estadísticas aparecerán aquí cuando comiences tu primer check-in
            </p>
          </div>
        </div>

        {/* History */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Historial</h2>
          
          <div className="space-y-3">
            <EmptyState />
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard({ 
  icon, 
  label, 
  value,
  color = 'cyan'
}: { 
  icon: React.ReactNode
  label: string
  value: string
  color?: 'green' | 'yellow' | 'cyan'
}) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
    cyan: 'bg-cyan-500/10 border-cyan-500/20',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white text-center mb-1">{value}</div>
      <div className="text-xs text-gray-400 text-center">{label}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-gray-600" />
      </div>
      <p className="text-gray-400 text-sm mb-2">No hay check-ins aún</p>
      <p className="text-gray-500 text-xs">
        Tus check-ins diarios aparecerán aquí
      </p>
    </div>
  )
}
