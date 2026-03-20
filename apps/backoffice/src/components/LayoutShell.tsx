'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen relative">
      {/* Mobile header - solo visible en móvil */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 glass border-b border-cyan-500/20 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-lg font-bold text-gradient">PULZE</span>
        <div className="w-10" />
      </header>

      {/* Overlay cuando sidebar abierto en móvil */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300 ease-in-out
          w-64
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen pt-14 lg:pt-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
