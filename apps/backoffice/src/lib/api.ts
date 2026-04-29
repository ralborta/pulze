/**
 * Cliente API del backoffice.
 * Llama a las rutas /api/admin/* del propio backoffice, que hacen proxy al bot.
 */

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `/api${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || `Error ${res.status}`)
  }
  return res.json()
}

export interface User {
  id: string
  phone: string
  name: string
  email: string | null
  goal: string
  restrictions: string | null
  bodyData: string | null
  heightCm: number | null
  weightKg: number | null
  age: number | null
  sex: string | null
  activityLevel: string | null
  mealsPerDay: number | null
  proteinEnough: string | null
  dietaryRestriction: string | null
  baselineSleep: number | null
  baselineEnergy: number | null
  baselineMood: number | null
  currentStreak: number
  longestStreak: number
  onboardingComplete: boolean
  isActive: boolean
  isPremium: boolean
  botEnabled: boolean
  createdAt: string
  stats?: { currentStreak: number; longestStreak: number }
  conversations?: Array<{
    id: string
    role: string
    message: string
    timestamp: string
  }>
  checkIns?: Array<{
    id: string
    timestamp: string
    sleep: number
    energy: number
    mood: string
  }>
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AnalyticsResponse {
  users: { total: number; active: number; premium: number }
  checkIns?: { total: number; todayCount: number }
  engagement?: { retention7d: number; averageStreak: number }
}

export interface StandardPlan {
  id: string
  title: string
  description: string | null
  content: string
  category: string
  difficulty: string
  equipment: string[]
  duration: string | null
  tags: string[]
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StandardPlansResponse {
  plans: StandardPlan[]
  total: number
}

export interface Content {
  id: string
  category: string
  type: string
  title: string
  description: string
  content: string
  tags: string[]
  difficulty: string | null
  duration: string | null
  viewCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentsResponse {
  contents: Content[]
  total: number
}

export interface MessageTemplate {
  id: string
  key: string
  type: string
  name: string
  content: string
  variables: string[]
  usageCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TemplatesResponse {
  templates: MessageTemplate[]
  total: number
}

export const api = {
  users: {
    list: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams()
      if (params?.status) sp.set('status', params.status)
      if (params?.search) sp.set('search', params.search)
      if (params?.page) sp.set('page', String(params.page))
      if (params?.limit) sp.set('limit', String(params.limit))
      const q = sp.toString()
      return fetchApi<UsersResponse>(`/admin/users${q ? `?${q}` : ''}`)
    },
    get: (id: string) => fetchApi<User>(`/admin/users/${id}`),
  },
  analytics: {
    get: (days?: number) =>
      fetchApi<AnalyticsResponse>(`/admin/analytics${days ? `?days=${days}` : ''}`),
  },
  contents: {
    list: (params?: { category?: string; type?: string; isActive?: string }) => {
      const sp = new URLSearchParams()
      if (params?.category) sp.set('category', params.category)
      if (params?.type) sp.set('type', params.type)
      if (params?.isActive) sp.set('isActive', params.isActive)
      const q = sp.toString()
      return fetchApi<ContentsResponse>(`/admin/contents${q ? `?${q}` : ''}`)
    },
    create: (data: Partial<Content>) =>
      fetchApi<Content>('/admin/contents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Content>) =>
      fetchApi<Content>(`/admin/contents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<{ message: string }>(`/admin/contents/${id}`, { method: 'DELETE' }),
  },
  templates: {
    list: () => fetchApi<TemplatesResponse>('/admin/templates'),
    create: (data: Partial<MessageTemplate>) =>
      fetchApi<MessageTemplate>('/admin/templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<MessageTemplate>) =>
      fetchApi<MessageTemplate>(`/admin/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  standardPlans: {
    list: (params?: { category?: string; difficulty?: string; active?: string }) => {
      const sp = new URLSearchParams()
      if (params?.category) sp.set('category', params.category)
      if (params?.difficulty) sp.set('difficulty', params.difficulty)
      if (params?.active) sp.set('active', params.active)
      const q = sp.toString()
      return fetchApi<StandardPlansResponse>(`/admin/standard-plans${q ? `?${q}` : ''}`)
    },
    create: (data: Partial<StandardPlan>) =>
      fetchApi<StandardPlan>('/admin/standard-plans', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<StandardPlan>) =>
      fetchApi<StandardPlan>(`/admin/standard-plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ message: string }>(`/admin/standard-plans/${id}`, {
        method: 'DELETE',
      }),
  },
}
