'use client'

import { TrendingUp, Users, Activity, MessageSquare, Calendar, Download, BarChart3, LineChart, PieChart } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Analytics</h1>
          <p className="text-gray-400">Métricas y análisis de la plataforma</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition">
          <Download className="w-5 h-5" />
          Exportar Reporte
        </button>
      </header>

      {/* Time Period Selector */}
      <div className="glass rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg font-medium transition">
              Últimos 7 días
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg font-medium transition">
              Últimos 30 días
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg font-medium transition">
              Últimos 90 días
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg font-medium transition">
              Todo el tiempo
            </button>
          </div>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Usuarios Activos"
          value="856"
          change="+12.5%"
          trend="up"
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Retención 7d"
          value="78.3%"
          change="+3.2%"
          trend="up"
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Check-ins Diarios"
          value="432"
          change="+18.7%"
          trend="up"
          icon={<MessageSquare className="w-6 h-6" />}
          color="purple"
        />
        <KPICard
          title="Engagement Rate"
          value="64.2%"
          change="-2.1%"
          trend="down"
          icon={<Activity className="w-6 h-6" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Growth Chart */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <LineChart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Crecimiento de Usuarios</h2>
                <p className="text-sm text-gray-400">Últimos 30 días</p>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 52, 48, 61, 69, 58, 73, 67, 78, 82, 76, 89, 94, 87, 92, 98, 105, 112, 108, 118, 125, 131, 128, 142, 138, 145, 152, 148, 156, 163].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-cyan-500/50 to-blue-500/50 rounded-t-lg hover:from-cyan-400/60 hover:to-blue-400/60 transition"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
        </div>

        {/* Retention Chart */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <BarChart3 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Retención por Cohorte</h2>
                <p className="text-sm text-gray-400">Usuarios activos por semana</p>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[100, 95, 89, 82, 78, 75, 71, 68].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-green-500/50 to-emerald-500/50 rounded-t-lg hover:from-green-400/60 hover:to-emerald-400/60 transition"
                  style={{ height: `${height * 2.5}px` }}
                />
                <span className="text-xs text-gray-400">S{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Performance */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <PieChart className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Top Contenidos</h2>
              <p className="text-sm text-gray-400">Más utilizados</p>
            </div>
          </div>
          <div className="space-y-4">
            <ContentMetric title="5 tips para dormir mejor" views={789} percentage={15.2} />
            <ContentMetric title="Rutina de inicio: 15 min" views={621} percentage={12.0} />
            <ContentMetric title="Pre-entreno casero natural" views={543} percentage={10.5} />
            <ContentMetric title="Guía de hidratación" views={432} percentage={8.3} />
            <ContentMetric title="Estiramientos post-entreno" views={389} percentage={7.5} />
          </div>
        </div>

        {/* User Engagement */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Engagement</h2>
              <p className="text-sm text-gray-400">Métricas clave</p>
            </div>
          </div>
          <div className="space-y-4">
            <EngagementMetric label="Check-ins completados" value="432/856" percentage={50.5} />
            <EngagementMetric label="Tasa de respuesta" value="78.3%" percentage={78.3} />
            <EngagementMetric label="Racha promedio" value="6.5 días" percentage={65.0} />
            <EngagementMetric label="Contenido consumido" value="3.2/usuario" percentage={64.0} />
            <EngagementMetric label="Tiempo promedio sesión" value="4.8 min" percentage={48.0} />
          </div>
        </div>

        {/* Goals Distribution */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Objetivos</h2>
              <p className="text-sm text-gray-400">Distribución</p>
            </div>
          </div>
          <div className="space-y-4">
            <GoalMetric label="Bajar peso" users={432} percentage={35.0} color="blue" />
            <GoalMetric label="Ganar músculo" users={348} percentage={28.2} color="green" />
            <GoalMetric label="Mejorar energía" users={256} percentage={20.7} color="purple" />
            <GoalMetric label="Mejorar hábitos" users={142} percentage={11.5} color="orange" />
            <GoalMetric label="Otros" users={56} percentage={4.5} color="gray" />
          </div>
        </div>
      </div>
    </>
  )
}

function KPICard({ 
  title, 
  value, 
  change, 
  trend,
  icon, 
  color 
}: { 
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
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
        <span className={`text-sm font-semibold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </span>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function ContentMetric({ 
  title, 
  views, 
  percentage 
}: { 
  title: string
  views: number
  percentage: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{title}</span>
        <span className="text-sm font-semibold text-white">{views}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function EngagementMetric({ 
  label, 
  value, 
  percentage 
}: { 
  label: string
  value: string
  percentage: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function GoalMetric({ 
  label, 
  users, 
  percentage,
  color 
}: { 
  label: string
  users: number
  percentage: number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'gray'
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-amber-500',
    gray: 'from-gray-500 to-slate-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-semibold text-white">{users} usuarios</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
