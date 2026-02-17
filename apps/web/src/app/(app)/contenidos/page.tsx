'use client'

import { BookOpen, Dumbbell, Salad, Brain, Heart, Sparkles } from 'lucide-react'

const contentCategories = [
  {
    icon: <Dumbbell className="w-6 h-6 text-orange-400" />,
    title: 'Entrenamiento',
    count: '12 guías',
    color: 'orange',
  },
  {
    icon: <Salad className="w-6 h-6 text-green-400" />,
    title: 'Nutrición',
    count: '15 tips',
    color: 'green',
  },
  {
    icon: <Brain className="w-6 h-6 text-purple-400" />,
    title: 'Mentalidad',
    count: '8 artículos',
    color: 'purple',
  },
  {
    icon: <Heart className="w-6 h-6 text-pink-400" />,
    title: 'Bienestar',
    count: '10 recursos',
    color: 'pink',
  },
]

export default function ContenidosPage() {
  return (
    <>
      {/* Header */}
      <header className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center glow-cyan">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gradient mb-1">Contenidos</h1>
        <p className="text-cyan-300 text-sm">Tu biblioteca de bienestar</p>
      </header>

      <div className="space-y-4">
        {/* Categories Grid */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Categorías</h2>
          <div className="grid grid-cols-2 gap-3">
            {contentCategories.map((category, index) => (
              <CategoryCard key={index} {...category} />
            ))}
          </div>
        </div>

        {/* Featured Content */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Destacados</h2>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          
          <div className="space-y-3">
            <ContentCard
              title="Cómo mejorar tu sueño"
              category="Bienestar"
              readTime="5 min"
              color="pink"
            />
            <ContentCard
              title="Rutina matutina energizante"
              category="Entrenamiento"
              readTime="3 min"
              color="orange"
            />
            <ContentCard
              title="Snacks saludables rápidos"
              category="Nutrición"
              readTime="4 min"
              color="green"
            />
          </div>
        </div>

        {/* Coming Soon */}
        <div className="glass rounded-3xl p-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Más contenido próximamente</h3>
            <p className="text-gray-400 text-sm">
              Estamos preparando más guías personalizadas para ti
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function CategoryCard({ 
  icon, 
  title, 
  count, 
  color 
}: { 
  icon: React.ReactNode
  title: string
  count: string
  color: 'orange' | 'green' | 'purple' | 'pink'
}) {
  const colorClasses = {
    orange: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
    green: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
    pink: 'bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20',
  }

  return (
    <button className={`${colorClasses[color]} border rounded-xl p-4 text-left transition-all group`}>
      <div className="group-hover:scale-110 transition-transform mb-3">{icon}</div>
      <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
      <p className="text-gray-400 text-xs">{count}</p>
    </button>
  )
}

function ContentCard({ 
  title, 
  category, 
  readTime,
  color 
}: { 
  title: string
  category: string
  readTime: string
  color: 'orange' | 'green' | 'pink'
}) {
  const colorClasses = {
    orange: 'text-orange-400',
    green: 'text-green-400',
    pink: 'text-pink-400',
  }

  return (
    <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-left transition-all group">
      <h3 className="text-white font-semibold mb-2 group-hover:text-cyan-400 transition">{title}</h3>
      <div className="flex items-center gap-3 text-xs">
        <span className={`${colorClasses[color]} font-medium`}>{category}</span>
        <span className="text-gray-500">•</span>
        <span className="text-gray-400">{readTime} lectura</span>
      </div>
    </button>
  )
}
