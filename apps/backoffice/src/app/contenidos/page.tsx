'use client'

import { FileText, Plus, Search, Filter, Edit, Trash2, Eye, Tag } from 'lucide-react'

export default function ContenidosPage() {
  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Contenidos</h1>
          <p className="text-gray-400">Gestión de tips, rutinas y guías</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition">
          <Plus className="w-5 h-5" />
          Nuevo Contenido
        </button>
      </header>

      {/* Filters */}
      <div className="glass rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar contenidos..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition"
            />
          </div>
          <select className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50 transition">
            <option value="">Todas las categorías</option>
            <option value="tips">Tips</option>
            <option value="rutinas">Rutinas</option>
            <option value="guias">Guías</option>
            <option value="nutricion">Nutrición</option>
            <option value="mindset">Mindset</option>
          </select>
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition">
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <QuickStat label="Total" value="247" color="blue" />
        <QuickStat label="Tips" value="128" color="green" />
        <QuickStat label="Rutinas" value="84" color="purple" />
        <QuickStat label="Guías" value="35" color="orange" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ContentCard
          title="Rutina de inicio: 15 minutos"
          category="Rutinas"
          categoryColor="purple"
          views={432}
          usage="Alto"
          tags={["Principiante", "Casa", "Sin equipo"]}
        />
        <ContentCard
          title="5 tips para dormir mejor"
          category="Tips"
          categoryColor="green"
          views={789}
          usage="Muy Alto"
          tags={["Sueño", "Descanso", "Hábitos"]}
        />
        <ContentCard
          title="Guía completa de hidratación"
          category="Guías"
          categoryColor="blue"
          views={256}
          usage="Medio"
          tags={["Nutrición", "Agua", "Salud"]}
        />
        <ContentCard
          title="Pre-entreno casero natural"
          category="Nutrición"
          categoryColor="orange"
          views={543}
          usage="Alto"
          tags={["Recetas", "Pre-entreno", "Natural"]}
        />
        <ContentCard
          title="Estiramientos post-entreno"
          category="Rutinas"
          categoryColor="purple"
          views={621}
          usage="Alto"
          tags={["Recuperación", "Movilidad", "Flexibilidad"]}
        />
        <ContentCard
          title="Mindset: superar mesetas"
          category="Mindset"
          categoryColor="cyan"
          views={189}
          usage="Bajo"
          tags={["Mental", "Motivación", "Progreso"]}
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
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <p className="text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function ContentCard({ 
  title, 
  category, 
  categoryColor,
  views, 
  usage,
  tags 
}: { 
  title: string
  category: string
  categoryColor: string
  views: number
  usage: string
  tags: string[]
}) {
  const categoryColorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  }

  const usageColorClasses = {
    'Muy Alto': 'bg-green-500/20 text-green-400',
    'Alto': 'bg-blue-500/20 text-blue-400',
    'Medio': 'bg-yellow-500/20 text-yellow-400',
    'Bajo': 'bg-gray-500/20 text-gray-400',
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 hover:border-cyan-500/30 transition group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <span className={`text-xs px-2 py-1 rounded-full font-medium border ${categoryColorClasses[categoryColor as keyof typeof categoryColorClasses]}`}>
            {category}
          </span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition">
            <Eye className="w-4 h-4 text-gray-300" />
          </button>
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition">
            <Edit className="w-4 h-4 text-cyan-400" />
          </button>
          <button className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg transition">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <span key={index} className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded-lg flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Eye className="w-4 h-4" />
            <span>{views} vistas</span>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${usageColorClasses[usage as keyof typeof usageColorClasses]}`}>
          Uso {usage}
        </span>
      </div>
    </div>
  )
}
