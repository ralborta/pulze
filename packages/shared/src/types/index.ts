export interface User {
  id: string
  phone: string
  name: string
  goal: string
  restrictions?: string | null
  isActive: boolean
  isPremium: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CheckIn {
  id: string
  userId: string
  sleep: number
  energy: number
  mood: number
  willTrain: boolean
  timestamp: Date
}

export interface UserPreferences {
  id: string
  userId: string
  reminderTime: string
  reminderDays: string[]
  language: string
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface Content {
  id: string
  type: string
  title: string
  description: string
  content: string
  tags: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MessageTemplate {
  id: string
  key: string
  name: string
  content: string
  variables: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Analytics {
  id: string
  eventType: string
  userId?: string | null
  metadata?: any
  timestamp: Date
}
