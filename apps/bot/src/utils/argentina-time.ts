const TZ = 'America/Argentina/Buenos_Aires'

/** Hora local 0–23 en Argentina. */
export function getArgentinaHour(date = new Date()): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      hour: 'numeric',
      hour12: false,
    }).format(date),
    10,
  )
}

/** Inicio del día calendario en Argentina (UTC Date). */
export function getArgentinaStartOfToday(date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  // en-CA → YYYY-MM-DD
  return new Date(`${parts}T00:00:00-03:00`)
}
