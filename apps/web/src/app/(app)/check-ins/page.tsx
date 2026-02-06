'use client'

import { CalendarCheck } from 'lucide-react'
import Link from 'next/link'

export default function CheckInsPage() {
  return (
    <>
      <header className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-3">
          <CalendarCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Historial de check-ins</h1>
        <p className="text-gray-600 text-sm">Tu registro diario</p>
      </header>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <p className="text-gray-600 mb-4">
          Acá vas a ver todos tus check-ins: sueño, energía, ánimo y si entrenaste. Los check-ins se hacen por WhatsApp.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-sm mb-2">Aún no hay check-ins</p>
          <p className="text-gray-400 text-xs">Escribí &quot;check-in&quot; o &quot;checkin&quot; al bot de PULZE en WhatsApp para cargar tu primer registro.</p>
        </div>
        <Link
          href="https://wa.me/?text=checkin"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm transition"
        >
          Abrir WhatsApp y hacer check-in
        </Link>
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">¿Qué es un check-in?</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Sueño (1–10)</li>
          <li>• Energía (1–10)</li>
          <li>• Ánimo (1–10)</li>
          <li>• ¿Entrenás hoy? (sí/no)</li>
        </ul>
        <p className="text-xs text-gray-500 mt-2">Toma menos de 30 segundos. Con eso el bot te da una recomendación del día.</p>
      </div>
    </>
  )
}
