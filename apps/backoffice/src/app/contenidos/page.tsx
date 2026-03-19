'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Search, Edit, Trash2, Tag, X, Save, Loader2 } from 'lucide-react'
import { api, type Content } from '@/lib/api'

const CATEGORIES = ['Entrenamiento', 'Nutrición', 'Mentalidad', 'Bienestar']
const TYPES = ['tip', 'guia', 'rutina', 'articulo']
const DIFFICULTIES = ['Principiante', 'Intermedio', 'Avanzado']

export default function ContenidosPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['contents', categoryFilter, typeFilter],
    queryFn: () =>
      api.contents.list({
        category: categoryFilter || undefined,
        type: typeFilter || undefined,
      }),
  })

  const contents = data?.contents ?? []
  const filtered = search
    ? contents.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : contents

  return (
    <>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Contenidos</h1>
          <p className="text-gray-400">Gestión de tips, rutinas y guías. Base para la IA.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Contenido
        </button>
      </header>

      <div className="glass rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar contenidos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
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

      <div className="grid grid-cols-4 gap-4 mb-6">
        <QuickStat label="Total" value={String(contents.length)} color="blue" />
        <QuickStat
          label="Tips"
          value={String(contents.filter((c) => c.type === 'tip').length)}
          color="green"
        />
        <QuickStat
          label="Rutinas"
          value={String(contents.filter((c) => c.type === 'rutina').length)}
          color="purple"
        />
        <QuickStat
          label="Guías"
          value={String(contents.filter((c) => c.type === 'guia').length)}
          color="orange"
        />
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        {isLoading && (
          <div className="p-12 text-center text-gray-400">Cargando contenidos...</div>
        )}
        {error && (
          <div className="p-12 text-center text-red-400">
            Error al cargar. ¿Configuraste BOT_API_URL y BACKOFFICE_API_KEY?
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            No hay contenidos. Creá el primero para que la IA pueda usarlos.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filtered.map((c) => (
            <ContentCard
              key={c.id}
              content={c}
              onEdit={() => setEditingContent(c)}
              onDelete={() => {
                if (confirm('¿Eliminar este contenido?')) {
                  api.contents.delete(c.id).then(() =>
                    queryClient.invalidateQueries({ queryKey: ['contents'] })
                  )
                }
              }}
            />
          ))}
        </div>
      </div>

      {showCreate && (
        <ContentFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            queryClient.invalidateQueries({ queryKey: ['contents'] })
          }}
        />
      )}
      {editingContent && (
        <ContentFormModal
          content={editingContent}
          onClose={() => setEditingContent(null)}
          onSuccess={() => {
            setEditingContent(null)
            queryClient.invalidateQueries({ queryKey: ['contents'] })
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

function ContentCard({
  content,
  onEdit,
  onDelete,
}: {
  content: Content
  onEdit: () => void
  onDelete: () => void
}) {
  const categoryColors: Record<string, string> = {
    Entrenamiento: 'purple',
    Nutrición: 'orange',
    Mentalidad: 'cyan',
    Bienestar: 'green',
  }
  const color = categoryColors[content.category] || 'blue'
  const usage =
    content.viewCount > 500 ? 'Muy Alto' : content.viewCount > 100 ? 'Alto' : content.viewCount > 20 ? 'Medio' : 'Bajo'

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition group">
      <div className="flex items-start justify-between mb-4">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium border ${
            color === 'purple'
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              : color === 'orange'
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                : color === 'cyan'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-green-500/10 text-green-400 border-green-500/30'
          }`}
        >
          {content.category}
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
      <h3 className="text-lg font-semibold text-white mb-2">{content.title}</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {(content.tags || []).slice(0, 4).map((t, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded-lg flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <span className="text-sm text-gray-400">{content.viewCount} vistas</span>
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            usage === 'Muy Alto'
              ? 'bg-green-500/20 text-green-400'
              : usage === 'Alto'
                ? 'bg-blue-500/20 text-blue-400'
                : usage === 'Medio'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          Uso {usage}
        </span>
      </div>
    </div>
  )
}

function ContentFormModal({
  content,
  onClose,
  onSuccess,
}: {
  content?: Content
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState(content?.title ?? '')
  const [description, setDescription] = useState(content?.description ?? '')
  const [body, setBody] = useState(content?.content ?? '')
  const [category, setCategory] = useState(content?.category ?? 'Entrenamiento')
  const [type, setType] = useState(content?.type ?? 'tip')
  const [difficulty, setDifficulty] = useState(content?.difficulty ?? '')
  const [duration, setDuration] = useState(content?.duration ?? '')
  const [tagsInput, setTagsInput] = useState((content?.tags ?? []).join(', '))

  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: () =>
      api.contents.create({
        title,
        description,
        content: body,
        category,
        type,
        tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
        difficulty: difficulty || undefined,
        duration: duration || undefined,
      }),
    onSuccess: () => onSuccess(),
  })
  const updateMutation = useMutation({
    mutationFn: () =>
      api.contents.update(content!.id, {
        title,
        description,
        content: body,
        category,
        type,
        tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
        difficulty: difficulty || undefined,
        duration: duration || undefined,
      }),
    onSuccess: () => onSuccess(),
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content) updateMutation.mutate()
    else createMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {content ? 'Editar contenido' : 'Nuevo contenido'}
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
              placeholder="Ej: 5 tips para dormir mejor"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descripción *</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Breve descripción"
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
              <label className="block text-sm text-gray-400 mb-1">Tipo *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Dificultad</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">-</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duración</label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                placeholder="5 min, 15 min"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tags (separados por coma)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="sueño, descanso, hábitos"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contenido *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={8}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="Texto completo del contenido. La IA usará esto como base."
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
              {content ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
