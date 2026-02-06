'use client'

import { BookOpen } from 'lucide-react'

export default function ContenidosPage() {
  return (
    <>
      <header className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-3">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Biblioteca de contenidos</h1>
        <p className="text-gray-600 text-sm">Tips y recursos de bienestar</p>
      </header>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <p className="text-gray-600 mb-4">
          En esta sección vas a encontrar artículos, tips y recursos curados para tu bienestar. Se irán sumando contenidos según tu objetivo.
        </p>
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm">Próximamente</p>
          <p className="text-gray-400 text-xs mt-1">Los contenidos se cargarán aquí cuando estén disponibles.</p>
        </div>
      </div>
    </>
  )
}
