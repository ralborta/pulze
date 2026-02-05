export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function isValidScore(score: number): boolean {
  return score >= 1 && score <= 10 && Number.isInteger(score)
}

export function getScoreLevel(score: number): 'low' | 'medium' | 'high' {
  if (score <= 4) return 'low'
  if (score <= 7) return 'medium'
  return 'high'
}

export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
}

export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
  if (format === 'short') {
    return date.toLocaleDateString('es-AR')
  }
  return date.toLocaleDateString('es-AR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}
