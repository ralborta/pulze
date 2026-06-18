'use client'

import { useEffect, useState } from 'react'
import { Activity, Flame, TrendingUp, Target, Zap, Heart, Brain, Moon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { fetchMe, fetchMyStats, UserStats } from '@/lib/api'
import { getSessionUser, SessionUser } from '@/lib/auth-storage'
import { waMeUrl } from '@/lib/whatsapp'

export default function DashboardPage() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [goal, setGoal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = getSessionUser()
    setSessionUser(user)
    if (!user) return

    setLoading(true)
    Promise.all([fetchMyStats(), fetchMe()])
      .then(([s, me]) => {
        setStats(s)
        setGoal(me.goal || null)
      })
      .catch(() => {
        // Sin sesión válida: mostrar UI mock
      })
      .finally(() => setLoading(false))
  }, [])

  const streak = stats?.currentStreak ?? 0
  const sleep = stats?.averageSleep != null ? stats.averageSleep.toFixed(1) : '–'
  const energy = stats?.averageEnergy != null ? stats.averageEnergy.toFixed(1) : '–'
  const hasCheckIns = (stats?.totalCheckIns ?? 0) > 0

  return (
    <>
      <header className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="relative w-20 h-20 animate-pulse-glow">
            <Image
              src="/pulze-logo-new.png"
              alt="PULZE"
              width={80}
              height={80}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gradient mb-1">
          {sessionUser?.name ? `Hola, ${sessionUser.name.split(' ')[0]}` : 'Mi Progreso'}
        </h1>
        <p className="text-cyan-300 text-sm">Tu resumen de bienestar</p>
      </header>

      <div className="space-y-4">
        <div className="glass rounded-3xl p-6 glow-cyan">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white mb-1">
                <Flame className="w-5 h-5 text-orange-400" />
                Racha Actual
              </h2>
              <p className="text-xs text-gray-400">Mantén el impulso</p>
            </div>
            {streak > 0 && (
              <div className="bg-orange-500/10 px-3 py-1 rounded-full">
                <span className="text-orange-400 text-xs font-semibold">🔥 Hot!</span>
              </div>
            )}
          </div>

          <div className="text-5xl font-bold text-gradient mb-2">
            {loading ? '…' : `${streak} ${streak === 1 ? 'día' : 'días'}`}
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {hasCheckIns
              ? `Tu mejor racha: ${stats?.longestStreak ?? 0} días`
              : 'Completá tu primer check-in para comenzar tu racha'}
          </p>

          <Link
            href={waMeUrl('checkin')}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Check-in en WhatsApp
            </span>
          </Link>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Últimos 7 Días
          </h2>
          <p className="text-xs text-gray-400 mb-4">Tus promedios</p>

          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Moon className="w-5 h-5 text-indigo-400" />}
              label="Sueño"
              value={loading ? '…' : sleep}
              unit="/10"
              color="indigo"
            />
            <StatCard
              icon={<Zap className="w-5 h-5 text-yellow-400" />}
              label="Energía"
              value={loading ? '…' : energy}
              unit="/10"
              color="yellow"
            />
            <StatCard
              icon={<Heart className="w-5 h-5 text-pink-400" />}
              label="Ánimo"
              value="–"
              unit="/10"
              color="pink"
            />
          </div>

          {!hasCheckIns && !loading && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-300 text-center">
                💡 Los promedios aparecen cuando tengas check-ins
              </p>
            </div>
          )}
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2 text-white">
            <Target className="w-5 h-5 text-cyan-400" />
            Tu Objetivo
          </h2>
          <p className="text-xs text-gray-400 mb-4">Personaliza tu experiencia</p>

          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-3">
              {goal || 'Definí tu objetivo en el onboarding por WhatsApp'}
            </p>
            <Link
              href="/preferencias"
              className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition inline-flex items-center gap-1"
            >
              Cambiar objetivo
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              href="/check-ins"
              icon={<Activity className="w-5 h-5" />}
              label="Ver Check-ins"
              color="cyan"
            />
            <QuickActionCard
              href="/contenidos"
              icon={<Brain className="w-5 h-5" />}
              label="Contenidos"
              color="blue"
            />
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
  unit,
  color = 'cyan',
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit: string
  color?: 'cyan' | 'yellow' | 'pink' | 'indigo'
}) {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
    pink: 'bg-pink-500/10 border-pink-500/20',
    indigo: 'bg-indigo-500/10 border-indigo-500/20',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4 text-center`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white mb-1">
        {value}
        <span className="text-lg text-gray-400">{unit}</span>
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

function QuickActionCard({
  href,
  icon,
  label,
  color = 'cyan',
}: {
  href: string
  icon: React.ReactNode
  label: string
  color?: 'cyan' | 'blue'
}) {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20',
  }

  return (
    <Link
      href={href}
      className={`${colorClasses[color]} border rounded-xl p-4 flex flex-col items-center gap-2 transition-all group`}
    >
      <div className="group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
