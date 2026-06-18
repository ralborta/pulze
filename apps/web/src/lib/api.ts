import {
  getApiBaseUrl,
  getSessionToken,
  SessionUser,
  setSession,
} from './auth-storage'

export type VerifyResponse = {
  token: string
  user: SessionUser
}

export type UserStats = {
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  averageSleep: number | null
  averageEnergy: number | null
}

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({ error: res.statusText }))
  return (err as { error?: string }).error || `Error ${res.status}`
}

export async function verifyMagicToken(token: string): Promise<VerifyResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as VerifyResponse
  setSession(data.token, data.user)
  return data
}

export async function fetchMyStats(): Promise<UserStats> {
  const token = getSessionToken()
  if (!token) throw new Error('No autenticado')

  const res = await fetch(`${getApiBaseUrl()}/api/users/me/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchMe(): Promise<SessionUser & { goal?: string; currentStreak?: number }> {
  const token = getSessionToken()
  if (!token) throw new Error('No autenticado')

  const res = await fetch(`${getApiBaseUrl()}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
