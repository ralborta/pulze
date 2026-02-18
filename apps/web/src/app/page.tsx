'use client'

import { Activity, Calendar, TrendingUp, Target, Sparkles, Zap, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-pulze-gradient text-white overflow-hidden">
      {/* Animated background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-md">
        {/* Logo Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40 animate-pulse-glow">
              <Image
                src="/pulze-logo-new.png"
                alt="PULZE Logo"
                width={160}
                height={160}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="glass rounded-3xl p-8 mb-8 glow-cyan">
          <h2 className="text-2xl font-bold mb-4 text-gradient">
            Tu Coach de Bienestar Personal
          </h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Transforma tu vida con{' '}
            <span className="text-cyan-400 font-semibold">check-ins diarios</span>,{' '}
            <span className="text-blue-400 font-semibold">recomendaciones IA</span> y{' '}
            <span className="text-cyan-400 font-semibold">seguimiento inteligente</span>.
          </p>

          {/* Feature Cards */}
          <div className="space-y-3">
            <FeatureCard
              href="/check-ins"
              icon={<Zap className="w-5 h-5" />}
              title="Check-ins Rápidos"
              description="30 segundos. Cada día cuenta."
              color="cyan"
            />
            <FeatureCard
              href="/dashboard"
              icon={<Sparkles className="w-5 h-5" />}
              title="IA Personalizada"
              description="Recomendaciones que se adaptan a ti"
              color="blue"
            />
            <FeatureCard
              href="/dashboard"
              icon={<TrendingUp className="w-5 h-5" />}
              title="Progreso Visual"
              description="Gráficos que inspiran acción"
              color="cyan"
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 mb-8">
          <Link
            href="/dashboard"
            className="group relative block w-full overflow-hidden rounded-2xl"
          >
            <div className="absolute inset-0 bg-pulze-gradient-light opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative py-5 px-6 text-center">
              <span className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <Target className="w-5 h-5" />
                Comenzar Ahora
              </span>
            </div>
          </Link>

          <Link
            href="/check-ins"
            className="block w-full glass hover:bg-white/10 py-5 px-6 rounded-2xl text-center transition-all border border-cyan-500/30"
          >
            <span className="text-cyan-300 font-semibold text-lg flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              Ver Check-ins
            </span>
          </Link>

          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=Hola%20PULZE`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full glass hover:bg-white/10 py-5 px-6 rounded-2xl text-center transition-all border border-blue-500/30"
          >
            <span className="text-blue-300 font-semibold text-lg flex items-center justify-center gap-2">
              <Heart className="w-5 h-5" />
              WhatsApp Coach
            </span>
          </a>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard number="10K+" label="Usuarios" />
          <StatCard number="95%" label="Satisfacción" />
          <StatCard number="7d" label="Racha Avg" />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400">
          💙 Instala esta PWA en tu móvil para acceso instantáneo
        </p>
      </div>
    </div>
  )
}

function FeatureCard({
  href,
  icon,
  title,
  description,
  color = 'cyan',
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  color?: 'cyan' | 'blue'
}) {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  }

  return (
    <Link
      href={href}
      className={`flex items-start gap-4 p-4 rounded-xl border ${colorClasses[color]} hover:bg-white/5 transition-all group`}
    >
      <div className="mt-0.5 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="flex-1">
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </Link>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-gradient mb-1">{number}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}
