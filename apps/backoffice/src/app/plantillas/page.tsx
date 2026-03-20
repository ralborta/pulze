'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Plus, Search, Edit, X, Save, Loader2 } from 'lucide-react'
import { api, type MessageTemplate } from '@/lib/api'

const TYPES = ['onboarding', 'checkin', 'resumen', 'reactivacion', 'felicitacion', 'general']

export default function PlantillasPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.templates.list(),
  })

  const templates = data?.templates ?? []
  const filtered = templates.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.key.toLowerCase().includes(search.toLowerCase()) || t.content?.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || t.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Plantillas</h1>
          <p className="text-sm sm:text-base text-gray-400">Mensajes automáticos y plantillas de respuesta. Base para la IA.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition shrink-0"
        >
          <Plus className="w-5 h-5" />
          Nueva Plantilla
        </button>
      </header>

      <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar plantillas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Todos los tipos</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <QuickStat label="Total" value={String(templates.length)} color="blue" />
        <QuickStat
          label="Activas"
          value={String(templates.filter((t) => t.isActive).length)}
          color="green"
        />
        <QuickStat
          label="Inactivas"
          value={String(templates.filter((t) => !t.isActive).length)}
          color="gray"
        />
        <QuickStat
          label="Más usadas"
          value={String(templates.filter((t) => t.usageCount > 100).length)}
          color="purple"
        />
      </div>

      <div className="glass rounded-2xl sm:rounded-3xl overflow-hidden">
        {isLoading && (
          <div className="p-8 sm:p-12 text-center text-gray-400">Cargando plantillas...</div>
        )}
        {error && (
          <div className="p-12 text-center text-red-400">
            Error al cargar. ¿Configuraste BOT_API_URL y BACKOFFICE_API_KEY?
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            No hay plantillas. Creá la primera para que la IA y n8n puedan usarlas.
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={() => setEditingTemplate(t)}
            />
          ))}
        </div>
      </div>

      {showCreate && (
        <TemplateFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            queryClient.invalidateQueries({ queryKey: ['templates'] })
          }}
        />
      )}
      {editingTemplate && (
        <TemplateFormModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={() => {
            setEditingTemplate(null)
            queryClient.invalidateQueries({ queryKey: ['templates'] })
          }}
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

function TemplateCard({ template, onEdit }: { template: MessageTemplate; onEdit: () => void }) {
  const typeColors: Record<string, string> = {
    onboarding: 'blue',
    checkin: 'green',
    resumen: 'purple',
    reactivacion: 'orange',
    felicitacion: 'yellow',
  }
  const color = typeColors[template.type] || 'gray'

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium border ${
                color === 'blue'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : color === 'green'
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : color === 'purple'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      : color === 'orange'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
              }`}
            >
              {template.type}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                template.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {template.isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">{template.name}</h3>
        </div>
        <button
          onClick={onEdit}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition opacity-0 group-hover:opacity-100"
        >
          <Edit className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-300 line-clamp-3">{template.content}</p>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>{template.usageCount.toLocaleString()} usos</span>
        <span className="text-xs text-gray-500">key: {template.key}</span>
      </div>
    </div>
  )
}

function TemplateFormModal({
  template,
  onClose,
  onSuccess,
}: {
  template?: MessageTemplate
  onClose: () => void
  onSuccess: () => void
}) {
  const [key, setKey] = useState(template?.key ?? '')
  const [name, setName] = useState(template?.name ?? '')
  const [content, setContent] = useState(template?.content ?? '')
  const [type, setType] = useState(template?.type ?? 'general')
  const [variablesInput, setVariablesInput] = useState((template?.variables ?? []).join(', '))
  const [isActive, setIsActive] = useState(template?.isActive ?? true)

  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: () =>
      api.templates.create({
        key,
        name,
        content,
        type,
        variables: variablesInput ? variablesInput.split(',').map((v) => v.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => onSuccess(),
  })
  const updateMutation = useMutation({
    mutationFn: () =>
      api.templates.update(template!.id, {
        name,
        content,
        type,
        variables: variablesInput ? variablesInput.split(',').map((v) => v.trim()).filter(Boolean) : [],
        isActive,
      }),
    onSuccess: () => onSuccess(),
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (template) updateMutation.mutate()
    else createMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {template ? 'Editar plantilla' : 'Nueva plantilla'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Key (identificador único) *</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              disabled={!!template}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
              placeholder="welcome, checkin_morning, weekly_summary"
            />
            {template && (
              <p className="text-xs text-gray-500 mt-1">La key no se puede modificar</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Bienvenida Inicial"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Variables (separadas por coma)</label>
            <input
              value={variablesInput}
              onChange={(e) => setVariablesInput(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="nombre, racha, logros"
            />
            <p className="text-xs text-gray-500 mt-1">Usá {'{{nombre}}'}, {'{{racha}}'}, etc. en el contenido</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contenido *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="¡Hola {{nombre}}! 👋 Bienvenido/a a PULZE..."
            />
          </div>
          {template && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded bg-white/5 border-white/10"
              />
              <label htmlFor="isActive" className="text-sm text-gray-400">
                Plantilla activa
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-xl text-white font-medium transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {template ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
