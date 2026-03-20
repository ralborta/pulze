'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  X,
  Activity,
  Scale,
  Utensils,
  Moon,
  Zap,
  Smile,
  AlertCircle,
} from 'lucide-react'
import { api, type User } from '@/lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function UsuariosPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', search, statusFilter],
    queryFn: () =>
      api.users.list({
        search: search || undefined,
        status: statusFilter || undefined,
        page: 1,
        limit: 50,
      }),
  })

  const users = data?.users ?? []
  const total = data?.total ?? 0
  const activeCount = users.filter((u) => u.isActive).length
  const inactiveCount = users.filter((u) => !u.isActive).length
  const premiumCount = users.filter((u) => u.isPremium).length

  return (
    <>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Usuarios</h1>
          <p className="text-sm sm:text-base text-gray-400">Gestión de usuarios de PULZE</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition shrink-0">
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </header>

      {/* Filters */}
      <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition">
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <QuickStat label="Total" value={String(total)} color="blue" />
        <QuickStat label="Activos" value={String(activeCount)} color="green" />
        <QuickStat label="Inactivos" value={String(inactiveCount)} color="gray" />
        <QuickStat label="Premium" value={String(premiumCount)} color="purple" />
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl sm:rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-300">
                  Usuario
                </th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-300">
                  Contacto
                </th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-300">
                  Objetivo
                </th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-300">
                  Datos
                </th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-300">
                  Racha
                </th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-300">
                  Estado
                </th>
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-300">
                  Registro
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    Cargando usuarios...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-red-400">
                    Error al cargar. ¿Configuraste BOT_API_URL y BACKOFFICE_API_KEY?
                  </td>
                </tr>
              )}
              {!isLoading && !error && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No hay usuarios
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  onViewDetail={() => setSelectedUser(user)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  )
}

function QuickStat({
  label,
  value,
  color,
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
  user,
  onViewDetail,
}: {
  user: User
  onViewDetail: () => void
}) {
  const joinDate = user.createdAt
    ? format(new Date(user.createdAt), 'd MMM yyyy', { locale: es })
    : '-'
  const hasOnboardingData =
    user.heightCm != null ||
    user.weightKg != null ||
    user.activityLevel ||
    user.mealsPerDay != null ||
    user.baselineSleep != null

  return (
    <tr className="hover:bg-white/5 transition">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {(user.name || '?')[0]}
            </span>
          </div>
          <div>
            <p className="font-semibold text-white">{user.name || '-'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-300 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            {user.email || '-'}
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            {user.phone}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-300">{user.goal || '-'}</span>
      </td>
      <td className="px-6 py-4">
        {hasOnboardingData ? (
          <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            Completado
          </span>
        ) : (
          <span className="text-xs text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="text-orange-400 font-semibold">
          🔥 {user.currentStreak ?? user.stats?.currentStreak ?? 0} días
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
            user.isActive
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}
        >
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-400 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {joinDate}
        </span>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={onViewDetail}
          className="p-2 rounded-lg hover:bg-white/10 text-cyan-400 transition"
          title="Ver detalle"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </td>
    </tr>
  )
}

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { data: fullUser, isLoading } = useQuery({
    queryKey: ['user', user.id],
    queryFn: () => api.users.get(user.id),
    enabled: !!user.id,
  })

  const u = fullUser ?? user

  const joinDate = u.createdAt
    ? format(new Date(u.createdAt), "d 'de' MMMM yyyy", { locale: es })
    : '-'

  const DataRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType
    label: string
    value: string | number | null | undefined
  }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-white font-medium">
          {value != null && value !== '' ? String(value) : '-'}
        </p>
      </div>
    </div>
  )

  const activityLabels: Record<string, string> = {
    sedentario: 'Sedentario',
    ligero: 'Ligero',
    moderado: 'Moderado',
    alto: 'Alto',
    '1': 'Sedentario',
    '2': 'Ligero',
    '3': 'Moderado',
    '4': 'Alto',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {u.name || 'Usuario'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading && !fullUser && (
            <p className="text-gray-400">Cargando detalle...</p>
          )}

          {/* Contacto */}
          <section>
            <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contacto
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">
                <span className="text-gray-500">Teléfono:</span> {u.phone}
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">Email:</span> {u.email || '-'}
              </p>
            </div>
          </section>

          {/* Datos de onboarding */}
          <section>
            <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Datos del onboarding
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DataRow
                icon={Scale}
                label="Peso / Altura"
                value={
                  u.weightKg != null && u.heightCm != null
                    ? `${u.weightKg} kg · ${u.heightCm} cm`
                    : u.bodyData || null
                }
              />
              <DataRow icon={Activity} label="Edad" value={u.age} />
              <DataRow
                icon={Activity}
                label="Nivel de actividad"
                value={
                  u.activityLevel
                    ? activityLabels[u.activityLevel] || u.activityLevel
                    : null
                }
              />
              <DataRow
                icon={Utensils}
                label="Comidas/día"
                value={u.mealsPerDay}
              />
              <DataRow
                icon={Utensils}
                label="Proteína suficiente"
                value={u.proteinEnough}
              />
              <DataRow
                icon={AlertCircle}
                label="Restricción alimentaria"
                value={u.dietaryRestriction}
              />
              <DataRow
                icon={AlertCircle}
                label="Restricciones físicas"
                value={u.restrictions}
              />
              <DataRow icon={Moon} label="Sueño baseline (1-10)" value={u.baselineSleep} />
              <DataRow icon={Zap} label="Energía baseline (1-10)" value={u.baselineEnergy} />
              <DataRow icon={Smile} label="Ánimo baseline (1-10)" value={u.baselineMood} />
            </div>
            {!u.heightCm &&
              !u.weightKg &&
              !u.activityLevel &&
              !u.mealsPerDay &&
              !u.baselineSleep &&
              !u.baselineEnergy &&
              !u.baselineMood &&
              !u.restrictions &&
              !u.dietaryRestriction && (
                <p className="text-sm text-gray-500 italic">
                  Sin datos de onboarding completados
                </p>
              )}
          </section>

          {/* Objetivo y estado */}
          <section>
            <h3 className="text-sm font-semibold text-cyan-400 mb-3">
              Objetivo y estado
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm">
                {u.goal || '-'}
              </span>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${
                  u.onboardingComplete
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {u.onboardingComplete ? 'Onboarding completo' : 'Onboarding pendiente'}
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm">
                🔥 {u.currentStreak} días racha
              </span>
            </div>
          </section>

          <p className="text-xs text-gray-500">
            Registro: {joinDate}
          </p>
        </div>
      </div>
    </div>
  )
}
