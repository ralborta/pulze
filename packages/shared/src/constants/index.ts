export const API_ROUTES = {
  USERS: '/api/users',
  CHECK_INS: '/api/checkins',
  STATS: '/api/stats',
  CONTENT: '/api/content',
  TEMPLATES: '/api/templates',
} as const

export const BOT_COMMANDS = {
  START: ['hola', 'start', 'comenzar'],
  HELP: ['ayuda', 'help', 'menu'],
  CHECK_IN: ['checkin', 'check-in', 'check in'],
  PROGRESS: ['progreso', 'progress'],
  WEEKLY: ['semanal', 'weekly', 'semana'],
} as const

export const CHECK_IN_QUESTIONS = {
  SLEEP: '¿Cómo dormiste anoche? (1-10)',
  ENERGY: '¿Tu nivel de energía hoy? (1-10)',
  MOOD: '¿Cómo está tu ánimo? (1-10)',
  WILL_TRAIN: '¿Vas a entrenar hoy? (sí/no)',
} as const

export const SCORING = {
  MIN: 1,
  MAX: 10,
  GOOD_THRESHOLD: 7,
  BAD_THRESHOLD: 4,
} as const
