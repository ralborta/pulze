'use client'

import { MessageSquare, Plus, Search, Edit, Trash2, Copy, Clock } from 'lucide-react'

export default function PlantillasPage() {
  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Plantillas</h1>
          <p className="text-gray-400">Mensajes automáticos y plantillas de respuesta</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition">
          <Plus className="w-5 h-5" />
          Nueva Plantilla
        </button>
      </header>

      {/* Filters */}
      <div className="glass rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar plantillas..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition"
            />
          </div>
          <select className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50 transition">
            <option value="">Todos los tipos</option>
            <option value="onboarding">Onboarding</option>
            <option value="checkin">Check-in</option>
            <option value="resumen">Resumen Semanal</option>
            <option value="reactivacion">Reactivación</option>
            <option value="felicitacion">Felicitación</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <QuickStat label="Total" value="24" color="blue" />
        <QuickStat label="Activas" value="18" color="green" />
        <QuickStat label="Borradores" value="6" color="gray" />
        <QuickStat label="Más usadas" value="12" color="purple" />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TemplateCard
          title="Bienvenida Inicial"
          type="Onboarding"
          typeColor="blue"
          message="¡Hola {{nombre}}! 👋 Bienvenido/a a PULZE. Soy tu asistente personal de bienestar. ¿Listo/a para comenzar este viaje juntos?"
          usage={1234}
          lastUsed="Hace 2 horas"
          status="Activa"
        />
        <TemplateCard
          title="Check-in Matutino"
          type="Check-in"
          typeColor="green"
          message="¡Buenos días {{nombre}}! ☀️ ¿Cómo dormiste anoche? (1-5) y ¿cómo te sientes hoy? Cuéntame en pocas palabras."
          usage={8945}
          lastUsed="Hace 15 min"
          status="Activa"
        />
        <TemplateCard
          title="Resumen Semanal Exitoso"
          type="Resumen Semanal"
          typeColor="purple"
          message="🎉 ¡Felicidades {{nombre}}! Completaste {{racha}} días seguidos. Esta semana lograste {{logros}}. ¿Listo para la próxima?"
          usage={432}
          lastUsed="Hace 1 día"
          status="Activa"
        />
        <TemplateCard
          title="Reactivación 48h"
          type="Reactivación"
          typeColor="orange"
          message="Hola {{nombre}} 👀 Hace un par de días que no te veo. ¿Todo bien? Recuerda que la constancia es clave. ¿Retomamos hoy?"
          usage={267}
          lastUsed="Hace 3 horas"
          status="Activa"
        />
        <TemplateCard
          title="Felicitación Racha 7 días"
          type="Felicitación"
          typeColor="yellow"
          message="🔥 ¡{{nombre}}, 7 días seguidos! Increíble constancia. Sigue así y verás los resultados. ¿Cómo te sientes con el progreso?"
          usage={189}
          lastUsed="Hace 5 horas"
          status="Activa"
        />
        <TemplateCard
          title="Recordatorio Check-in"
          type="Check-in"
          typeColor="green"
          message="Hola {{nombre}} 💪 Solo pasaba a recordarte tu check-in del día. ¿Cómo va todo?"
          usage={523}
          lastUsed="Hace 30 min"
          status="Activa"
        />
      </div>
    </>
  )
}

function QuickStat({ 
  label, 
  value, 
  color 
}: { 
  label: string
  value: string
  color: 'blue' | 'green' | 'gray' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    gray: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <p className="text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function TemplateCard({ 
  title, 
  type, 
  typeColor,
  message, 
  usage,
  lastUsed,
  status
}: { 
  title: string
  type: string
  typeColor: string
  message: string
  usage: number
  lastUsed: string
  status: string
}) {
  const typeColorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 hover:border-cyan-500/30 transition group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${typeColorClasses[typeColor as keyof typeof typeColorClasses]}`}>
              {type}
            </span>
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              {status}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition">
            <Copy className="w-4 h-4 text-cyan-400" />
          </button>
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition">
            <Edit className="w-4 h-4 text-cyan-400" />
          </button>
          <button className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg transition">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Message Preview */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-300 line-clamp-3">{message}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <span>{usage.toLocaleString()} usos</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{lastUsed}</span>
        </div>
      </div>
    </div>
  )
}
