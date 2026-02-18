'use client'

import { Settings as SettingsIcon, User, Bell, Database, Key, Shield, Mail, Palette, Globe, Save } from 'lucide-react'

export default function SettingsPage() {
  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">Configuración</h1>
        <p className="text-gray-400">Ajustes de la plataforma PULZE</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Menu */}
        <div className="lg:col-span-1">
          <div className="glass rounded-3xl p-4 space-y-2">
            <SettingMenuItem icon={<User className="w-5 h-5" />} label="Perfil" active />
            <SettingMenuItem icon={<Bell className="w-5 h-5" />} label="Notificaciones" />
            <SettingMenuItem icon={<Database className="w-5 h-5" />} label="Base de Datos" />
            <SettingMenuItem icon={<Key className="w-5 h-5" />} label="API Keys" />
            <SettingMenuItem icon={<Shield className="w-5 h-5" />} label="Seguridad" />
            <SettingMenuItem icon={<Mail className="w-5 h-5" />} label="Email" />
            <SettingMenuItem icon={<Palette className="w-5 h-5" />} label="Apariencia" />
            <SettingMenuItem icon={<Globe className="w-5 h-5" />} label="Región" />
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <User className="w-6 h-6 text-cyan-400" />
              Perfil de Administrador
            </h2>
            <div className="space-y-4">
              <InputField label="Nombre completo" value="Admin PULZE" />
              <InputField label="Email" value="admin@pulze.app" type="email" />
              <InputField label="Teléfono" value="+54 9 11 1234-5678" />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Foto de perfil
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">AP</span>
                  </div>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition">
                    Cambiar foto
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Bell className="w-6 h-6 text-cyan-400" />
              Notificaciones
            </h2>
            <div className="space-y-4">
              <ToggleSetting 
                label="Nuevos usuarios" 
                description="Recibir notificación cuando se registre un nuevo usuario"
                enabled 
              />
              <ToggleSetting 
                label="Usuarios inactivos" 
                description="Alertas cuando un usuario no responde por 48h+"
                enabled 
              />
              <ToggleSetting 
                label="Errores del sistema" 
                description="Notificaciones de errores críticos"
                enabled 
              />
              <ToggleSetting 
                label="Reportes semanales" 
                description="Resumen semanal automático por email"
                disabled 
              />
            </div>
          </div>

          {/* API Settings */}
          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Key className="w-6 h-6 text-cyan-400" />
              API Keys
            </h2>
            <div className="space-y-4">
              <APIKeyField 
                label="OpenAI API Key" 
                value="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                masked 
              />
              <APIKeyField 
                label="WhatsApp API Token" 
                value="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                masked 
              />
              <APIKeyField 
                label="Railway Token" 
                value="railway-xxxxxxxxxxxxxxxxxxxxxxxxx"
                masked 
              />
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-3">
                  Las API keys son sensibles. Nunca las compartas públicamente.
                </p>
                <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-medium transition">
                  Regenerar todas las keys
                </button>
              </div>
            </div>
          </div>

          {/* Database Settings */}
          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Database className="w-6 h-6 text-cyan-400" />
              Base de Datos
            </h2>
            <div className="space-y-4">
              <InfoField label="Proveedor" value="PostgreSQL (Railway)" />
              <InfoField label="Estado" value="Conectado" status="success" />
              <InfoField label="Última sincronización" value="Hace 2 minutos" />
              <InfoField label="Tamaño total" value="284 MB" />
              <div className="pt-4 border-t border-white/10 flex gap-3">
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition">
                  Ver migraciones
                </button>
                <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-medium transition">
                  Backup manual
                </button>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Palette className="w-6 h-6 text-cyan-400" />
              Apariencia
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Tema
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <ThemeOption label="Dark" selected />
                  <ThemeOption label="Light" />
                  <ThemeOption label="Auto" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Colores de marca
                </label>
                <div className="flex items-center gap-4">
                  <ColorPicker label="Primario" color="#00D9FF" />
                  <ColorPicker label="Secundario" color="#4A90E2" />
                  <ColorPicker label="Acento" color="#FF6B6B" />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition">
              <Save className="w-5 h-5" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function SettingMenuItem({ 
  icon, 
  label, 
  active 
}: { 
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
      active 
        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
        : 'text-gray-300 hover:bg-white/5'
    }`}>
      {icon}
      {label}
    </button>
  )
}

function InputField({ 
  label, 
  value, 
  type = 'text' 
}: { 
  label: string
  value: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        defaultValue={value}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition"
      />
    </div>
  )
}

function ToggleSetting({ 
  label, 
  description, 
  enabled 
}: { 
  label: string
  description: string
  enabled?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <button className={`relative w-12 h-6 rounded-full transition ${
        enabled ? 'bg-cyan-500' : 'bg-gray-600'
      }`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
          enabled ? 'left-7' : 'left-1'
        }`} />
      </button>
    </div>
  )
}

function APIKeyField({ 
  label, 
  value, 
  masked 
}: { 
  label: string
  value: string
  masked?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={masked ? 'password' : 'text'}
          defaultValue={value}
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition font-mono text-sm"
        />
        <button className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition">
          {masked ? 'Mostrar' : 'Ocultar'}
        </button>
      </div>
    </div>
  )
}

function InfoField({ 
  label, 
  value, 
  status 
}: { 
  label: string
  value: string
  status?: 'success' | 'error'
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        {status === 'success' && <div className="w-2 h-2 bg-green-400 rounded-full" />}
        {status === 'error' && <div className="w-2 h-2 bg-red-400 rounded-full" />}
        <span className="text-white font-semibold">{value}</span>
      </div>
    </div>
  )
}

function ThemeOption({ 
  label, 
  selected 
}: { 
  label: string
  selected?: boolean
}) {
  return (
    <button className={`px-4 py-3 rounded-xl font-medium transition ${
      selected 
        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
        : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
    }`}>
      {label}
    </button>
  )
}

function ColorPicker({ 
  label, 
  color 
}: { 
  label: string
  color: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 rounded-lg border border-white/20" 
          style={{ backgroundColor: color }}
        />
        <input
          type="text"
          defaultValue={color}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-cyan-500/50 transition"
        />
      </div>
    </div>
  )
}
