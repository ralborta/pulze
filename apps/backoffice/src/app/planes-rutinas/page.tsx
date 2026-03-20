'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dumbbell,
  Plus,
  Edit,
  Trash2,
  Tag,
  X,
  Save,
  Loader2,
} from 'lucide-react'
import { api, type StandardPlan } from '@/lib/api'

const CATEGORIES = ['Full body', 'Cardio', 'Piernas', 'Superior', 'Core', 'Estiramiento', 'Otro']
const DIFFICULTIES = ['Principiante', 'Intermedio', 'Avanzado']
const EQUIPMENT_OPTIONS = ['casa', 'sin equipo', 'gimnasio', 'mancuernas', 'bandas', 'peso corporal', 'otro']

export default function PlanesRutinasPage() {
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [editingPlan, setEditingPlan] = useState<StandardPlan | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['standardPlans', categoryFilter, difficultyFilter],
    queryFn: () =>
      api.standardPlans.list({
        category: categoryFilter || undefined,
        difficulty: difficultyFilter || undefined,
      }),
  })

  const plans = data?.plans ?? []

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Planes rutinas</h1>
          <p className="text-sm sm:text-base text-gray-400">
            Base para rutinas diarias. La IA adapta estos planes según cada usuario.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition shrink-0"
        >
          <Plus className="w-5 h-5" />
          Nuevo plan
        </button>
      </header>

      {/* Filters */}
      <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Todos los niveles</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <QuickStat label="Total" value={String(plans.length)} color="blue" />
        <QuickStat
          label="Principiante"
          value={String(plans.filter((p) => p.difficulty === 'Principiante').length)}
          color="green"
        />
        <QuickStat
          label="Intermedio"
          value={String(plans.filter((p) => p.difficulty === 'Intermedio').length)}
          color="purple"
        />
        <QuickStat
          label="Avanzado"
          value={String(plans.filter((p) => p.difficulty === 'Avanzado').length)}
          color="orange"
        />
      </div>

      {/* Plans Grid */}
      <div className="glass rounded-2xl sm:rounded-3xl overflow-hidden">
        {isLoading && (
          <div className="p-12 text-center text-gray-400">Cargando planes...</div>
        )}
        {error && (
          <div className="p-12 text-center text-red-400">
            Error al cargar. ¿Configuraste BOT_API_URL y BACKOFFICE_API_KEY?
          </div>
        )}
        {!isLoading && !error && plans.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            No hay planes. Creá el primero para que la IA pueda adaptar rutinas.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => setEditingPlan(plan)}
              onDelete={() => {
                if (confirm('¿Eliminar este plan?')) {
                  api.standardPlans.delete(plan.id).then(() =>
                    queryClient.invalidateQueries({ queryKey: ['standardPlans'] })
                  )
                }
              }}
            />
          ))}
        </div>
      </div>

      {showCreate && (
        <PlanFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            queryClient.invalidateQueries({ queryKey: ['standardPlans'] })
          }}
        />
      )}
      {editingPlan && (
        <PlanFormModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSuccess={() => {
            setEditingPlan(null)
            queryClient.invalidateQueries({ queryKey: ['standardPlans'] })
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
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  }
  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <p className="text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: StandardPlan
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          {plan.category}
        </span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={onEdit}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition"
          >
            <Edit className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{plan.title}</h3>
      {plan.duration && (
        <p className="text-sm text-gray-400 mb-2">⏱ {plan.duration}</p>
      )}
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded-lg">
          {plan.difficulty}
        </span>
        {plan.equipment.slice(0, 3).map((e, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded-lg">
            {e}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {plan.tags.slice(0, 4).map((t, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-white/5 text-gray-500 rounded flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {t}
          </span>
        ))}
      </div>
      <p className="text-ellipsis mt-3 text-sm text-gray-500 line-clamp-2">
        {plan.content}
      </p>
    </div>
  )
}

function PlanFormModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan?: StandardPlan
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState(plan?.title ?? '')
  const [description, setDescription] = useState(plan?.description ?? '')
  const [content, setContent] = useState(plan?.content ?? '')
  const [category, setCategory] = useState(plan?.category ?? 'Full body')
  const [difficulty, setDifficulty] = useState(plan?.difficulty ?? 'Principiante')
  const [equipment, setEquipment] = useState<string[]>(plan?.equipment ?? [])
  const [duration, setDuration] = useState(plan?.duration ?? '')
  const [tags, setTags] = useState(plan?.tags ?? [])
  const [tagsInput, setTagsInput] = useState(plan?.tags?.join(', ') ?? '')

  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: () =>
      api.standardPlans.create({
        title,
        description: description || undefined,
        content,
        category,
        difficulty,
        equipment,
        duration: duration || undefined,
        tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => onSuccess(),
  })
  const updateMutation = useMutation({
    mutationFn: () =>
      api.standardPlans.update(plan!.id, {
        title,
        description: description || undefined,
        content,
        category,
        difficulty,
        equipment,
        duration: duration || undefined,
        tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => onSuccess(),
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (plan) updateMutation.mutate()
    else createMutation.mutate()
  }

  const toggleEquipment = (eq: string) => {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {plan ? 'Editar plan' : 'Nuevo plan'}
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
            <label className="block text-sm text-gray-400 mb-1">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Ej: Rutina full body 15 min"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descripción (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Para admin"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Categoría *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nivel *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Duración (ej: 15 min)</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="15 min"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Equipo</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipment(eq)}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    equipment.includes(eq)
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tags (separados por coma)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="casa, principiante, recuperación"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contenido plantilla *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="Ejercicios, series, reps. La IA adaptará según restricciones y nivel del usuario."
            />
          </div>

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
              {plan ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
