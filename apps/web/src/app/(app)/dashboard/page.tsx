'use client'

import { Activity, Flame, TrendingUp, Target } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <>
      <header className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-3">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Mi progreso</h1>
        <p className="text-gray-600 text-sm">Tu resumen de bienestar</p>
      </header>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Racha actual
          </h2>
          <div className="text-4xl font-bold text-green-600 mb-1">0 días</div>
          <p className="text-sm text-gray-500">Completá tu primer check-in en WhatsApp para empezar</p>
          <Link
            href="https://wa.me/?text=checkin"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm transition"
          >
            Hacer check-in en WhatsApp
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Promedios (últimos 7 días)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Sueño" value="–" unit="/10" />
            <StatCard label="Energía" value="–" unit="/10" />
            <StatCard label="Ánimo" value="–" unit="/10" />
          </div>
          <p className="text-sm text-gray-500 mt-3">Los promedios aparecen cuando tengas check-ins</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Tu objetivo
          </h2>
          <p className="text-gray-600 text-sm">
            Definí tu objetivo en el onboarding por WhatsApp. Podés cambiarlo escribiendo &quot;preferencias&quot; al bot.
          </p>
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-2xl font-bold text-gray-900">{value}{unit}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
