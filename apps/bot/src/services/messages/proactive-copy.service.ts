/**
 * Textos para mensajes proactivos (n8n / scheduler).
 * Sin OpenAI: solo interpolación de datos que ya vienen de la DB o del body del endpoint.
 */

function firstName(fullName: string): string {
  const t = (fullName || '').trim()
  if (!t) return 'vos'
  return t.split(/\s+/)[0]
}

export function buildCheckinReminderCopy(params: {
  name: string
  currentStreak: number
}): string {
  const n = firstName(params.name)
  const streakLine =
    params.currentStreak > 0
      ? `Llevás ${params.currentStreak} día${params.currentStreak === 1 ? '' : 's'} de racha 🔥\n\n`
      : ''
  return `Hola ${n} 👋

${streakLine}Es hora de tu check-in diario. ¿Cómo amaneciste hoy?

Respondé con 3 datos:
1️⃣ Sueño (1-5)
2️⃣ Energía (1-5)
3️⃣ Ánimo (una palabra)

Ejemplo: 4, 3, bien`
}

export function buildReactivationCopy(params: {
  name: string
  daysSinceLastCheckIn: number
  currentStreak: number
}): string {
  const n = firstName(params.name)
  const d = params.daysSinceLastCheckIn
  return `Hola ${n} 👋

Hace ${d} día${d === 1 ? '' : 's'} que no registramos tu check-in. ¿Todo bien?

Cuando puedas, mandanos sueño (1-5), energía (1-5) y cómo estás en una palabra.

${params.currentStreak > 0 ? `Tu racha era de ${params.currentStreak} día${params.currentStreak === 1 ? '' : 's'} — podés retomar cuando quieras 💪` : 'Te esperamos.'}`
}

export function buildCelebrationCopy(params: {
  name: string
  currentStreak: number
}): string {
  const n = firstName(params.name)
  const s = params.currentStreak
  return `¡${n}, llegaste a ${s} día${s === 1 ? '' : 's'} seguidos! 🎉

Seguí así. Si querés, contanos cómo te sentís con este logro.`
}

export function buildWeeklyReportCopy(params: {
  name: string
  checkIns: Array<{ sleep: number; energy: number; timestamp: Date }>
}): string {
  const n = firstName(params.name)
  const list = params.checkIns || []
  if (list.length === 0) {
    return `Hola ${n}, tu resumen semanal: todavía no hay check-ins registrados esta semana. Mandá el primero cuando quieras 😊`
  }
  const nCheck = list.length
  const avgSleep = list.reduce((a, c) => a + c.sleep, 0) / nCheck
  const avgEnergy = list.reduce((a, c) => a + c.energy, 0) / nCheck
  return `Hola ${n}, tu resumen de la semana 📊

Check-ins: ${nCheck}
Promedio sueño: ${avgSleep.toFixed(1)}/5
Promedio energía: ${avgEnergy.toFixed(1)}/5

Seguimos acompañándote en PULZE.`
}
