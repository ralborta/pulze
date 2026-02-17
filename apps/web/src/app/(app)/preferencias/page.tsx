'use client'

import { Settings, Bell, Globe, MessageSquare, User, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function PreferenciasPage() {
  return (
    <>
      {/* Header */}
      <header className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center glow-cyan">
            <Settings className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gradient mb-1">Preferencias</h1>
        <p className="text-cyan-300 text-sm">Configurá tu experiencia</p>
      </header>

      <div className="space-y-4">
        {/* Profile */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Mi Perfil
          </h2>
          
          <div className="space-y-3">
            <SettingItem
              label="Nombre"
              value="Configurar en WhatsApp"
              href="https://wa.me/?text=mi%20perfil"
            />
            <SettingItem
              label="Objetivo"
              value="Mejorar bienestar general"
              href="https://wa.me/?text=cambiar%20objetivo"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            Recordatorios
          </h2>
          
          <div className="space-y-3">
            <SettingItem
              label="Horario de check-in"
              value="08:00 AM"
              href="https://wa.me/?text=cambiar%20horario"
            />
            <SettingItem
              label="Días activos"
              value="Lunes a Domingo"
              href="https://wa.me/?text=dias%20recordatorio"
            />
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-300 text-center">
              ⏰ Los recordatorios se configuran por WhatsApp
            </p>
          </div>
        </div>

        {/* Language & Region */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Región
          </h2>
          
          <div className="space-y-3">
            <SettingItem
              label="Idioma"
              value="Español"
              href="https://wa.me/?text=cambiar%20idioma"
            />
            <SettingItem
              label="Zona horaria"
              value="Buenos Aires (GMT-3)"
              href="https://wa.me/?text=zona%20horaria"
            />
          </div>
        </div>

        {/* WhatsApp Connection */}
        <div className="glass rounded-3xl p-6 glow-cyan">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            WhatsApp
          </h2>
          
          <p className="text-sm text-gray-300 mb-4">
            Tu progreso está sincronizado con WhatsApp. Usá el mismo número para ver tus datos aquí.
          </p>

          <Link
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=Hola`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm transition"
          >
            Abrir WhatsApp
          </Link>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-3xl p-6 border-red-500/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-400" />
            Cuenta
          </h2>
          
          <p className="text-sm text-gray-400 mb-4">
            Para eliminar tu cuenta o exportar tus datos, contactá por WhatsApp.
          </p>

          <Link
            href="https://wa.me/?text=eliminar%20cuenta"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-3 px-4 rounded-xl text-center text-sm border border-red-500/30 transition"
          >
            Eliminar mi cuenta
          </Link>
        </div>
      </div>
    </>
  )
}

function SettingItem({ 
  label, 
  value, 
  href 
}: { 
  label: string
  value: string
  href: string
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition group"
    >
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-white font-medium">{value}</p>
      </div>
      <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">→</span>
    </Link>
  )
}
