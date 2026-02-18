'use client'

import { Users, Search, Filter, UserPlus, Mail, Phone, Calendar } from 'lucide-react'

export default function UsuariosPage() {
  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Usuarios</h1>
          <p className="text-gray-400">Gestión de usuarios de PULZE</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition">
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </header>

      {/* Filters */}
      <div className="glass rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition">
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <QuickStat label="Total" value="1,234" color="blue" />
        <QuickStat label="Activos" value="856" color="green" />
        <QuickStat label="Inactivos" value="378" color="gray" />
        <QuickStat label="Premium" value="145" color="purple" />
      </div>

      {/* Users Table */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Usuario</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Contacto</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Objetivo</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Racha</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <UserTableRow
                name="María González"
                email="maria@example.com"
                phone="+54 9 11 1234-5678"
                goal="Bajar peso"
                streak={7}
                status="Activo"
                joinDate="15 Ene 2024"
              />
              <UserTableRow
                name="Juan Pérez"
                email="juan@example.com"
                phone="+54 9 11 8765-4321"
                goal="Ganar músculo"
                streak={12}
                status="Activo"
                joinDate="10 Ene 2024"
              />
              <UserTableRow
                name="Ana Martínez"
                email="ana@example.com"
                phone="+54 9 11 2345-6789"
                goal="Mejorar energía"
                streak={3}
                status="Inactivo"
                joinDate="8 Ene 2024"
              />
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function QuickStat({ 
  label, 
  value, 
  color 
}: { 
  label: string
  value: string
  color: 'blue' | 'green' | 'gray' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    gray: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <p className="text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function UserTableRow({ 
  name, 
  email, 
  phone, 
  goal, 
  streak, 
  status, 
  joinDate 
}: { 
  name: string
  email: string
  phone: string
  goal: string
  streak: number
  status: string
  joinDate: string
}) {
  return (
    <tr className="hover:bg-white/5 transition">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{name[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-white">{name}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-300 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            {email}
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            {phone}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-300">{goal}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-orange-400 font-semibold">🔥 {streak} días</span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
          status === 'Activo' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-400 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {joinDate}
        </span>
      </td>
    </tr>
  )
}
