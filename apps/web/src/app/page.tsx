'use client'

import { Activity, Calendar, TrendingUp, Target } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PULZE</h1>
          <p className="text-gray-600">Tu coach de bienestar personal</p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">¡Bienvenido!</h2>
          <p className="text-gray-600 mb-4">
            PULZE es tu compañero diario de bienestar. Combinamos la simplicidad de WhatsApp 
            con la profundidad de una webapp completa.
          </p>
          
          <div className="space-y-3">
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Check-ins diarios"
              description="30 segundos para mejorar tu día"
            />
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Recomendaciones personalizadas"
              description="Basadas en tu progreso real"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Seguimiento de progreso"
              description="Visualiza tu evolución"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl text-center transition"
          >
            Ver mi Dashboard
          </Link>
          
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=Hola`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white hover:bg-gray-50 text-green-600 font-semibold py-4 px-6 rounded-xl text-center border-2 border-green-500 transition"
          >
            Conectar con WhatsApp
          </a>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Instala esta app en tu móvil para acceso rápido
        </p>
      </div>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-green-500 mt-1">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
