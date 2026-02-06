'use client'

import { Settings } from 'lucide-react'
import Link from 'next/link'

export default function PreferenciasPage() {
  return (
    <>
      <header className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-3">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Preferencias</h1>
        <p className="text-gray-600 text-sm">Configurá tu experiencia</p>
      </header>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recordatorios</h2>
          <p className="text-gray-600 text-sm mb-4">
            El horario y los días del recordatorio de check-in se configuran por WhatsApp. Escribile al bot &quot;preferencias&quot; o &quot;recordatorio&quot;.
          </p>
          <Link
            href="https://wa.me/?text=preferencias"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm transition"
          >
            Configurar en WhatsApp
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Idioma y zona horaria</h2>
          <p className="text-gray-600 text-sm">
            También se gestionan desde el bot. Decile &quot;cambiar idioma&quot; o &quot;zona horaria&quot; para ajustarlos.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Conectar con WhatsApp</h2>
          <p className="text-gray-600 text-sm mb-4">
            Para que tu progreso y check-ins aparezcan en esta app, tenés que usar el mismo número de WhatsApp con el que te registraste en PULZE.
          </p>
          <Link
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=Hola`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white hover:bg-gray-50 text-green-600 font-semibold py-3 px-4 rounded-xl text-center text-sm border-2 border-green-500 transition"
          >
            Abrir WhatsApp
          </Link>
        </div>
      </div>
    </>
  )
}
