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
}
