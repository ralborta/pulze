'use client'

import Link from 'next/link'
import { BarChart3, Bell, Search, Sparkles } from 'lucide-react'

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-slate-800 font-semibold hover:text-slate-600">
            <BarChart3 className="w-6 h-6 text-teal-500" />
            <span>Cleexs</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/diagnostico" className="px-3 py-2 rounded-lg text-sm font-medium text-teal-600 bg-teal-50">
              Diagnóstico
            </Link>
            <Link href="/analytics" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              Analytics
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Versión inicial
          </span>
        </div>
      </div>
    </header>
  )
}
