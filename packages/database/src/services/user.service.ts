import { prisma } from '../client'
import type { User, Prisma } from '@prisma/client'

export class UserService {
  /**
   * Crear un nuevo usuario (durante onboarding)
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user = await prisma.user.create({
      data,
      include: {
        preferences: true,
        stats: true,
      },
    })

    // Crear UserStats y UserPreferences por defecto
    await prisma.userStats.create({
      data: { userId: user.id },
    })

    await prisma.userPreferences.create({
      data: { userId: user.id },
    })

    return user
  }

  /**
   * Buscar usuario por teléfono (WhatsApp)
   */
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
      include: {
        preferences: true,
        stats: true,
      },
    })
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
        stats: true,
        checkIns: {
          orderBy: { timestamp: 'desc' },
          take: 7, // Últimos 7 check-ins
        },
      },
    })
  }

  /**
   * Actualizar datos del usuario
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    })
  }

  /**
   * Actualizar racha del usuario
   */
  async updateStreak(userId: string, currentStreak: number): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const longestStreak = Math.max(user.longestStreak, currentStreak)

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak,
        longestStreak,
        lastCheckInDate: new Date(),
      },
    })

    await prisma.userStats.update({
      where: { userId },
      data: {
        currentStreak,
        longestStreak,
        lastActiveDate: new Date(),
      },
    })
  }

  /**
   * Marcar onboarding como completo
   */
  async completeOnboarding(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    })
  }

  /**
   * Obtener usuarios activos (para métricas)
   */
  async getActiveUsers(days: number = 7): Promise<User[]> {
    const date = new Date()
    date.setDate(date.getDate() - days)

    return prisma.user.findMany({
      where: {
        isActive: true,
        lastCheckInDate: {
          gte: date,
        },
      },
      include: {
        stats: true,
      },
    })
  }

  /**
   * Obtener usuarios inactivos (para reactivación)
   */
  async getInactiveUsers(days: number = 2): Promise<User[]> {
    const date = new Date()
    date.setDate(date.getDate() - days)

    return prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { lastCheckInDate: { lt: date } },
          { lastCheckInDate: null },
        ],
      },
      include: {
        preferences: true,
      },
    })
  }

  /**
   * Obtener estadísticas generales
   */
  async getStats() {
    const total = await prisma.user.count()
    const active = await prisma.user.count({ where: { isActive: true } })
    const premium = await prisma.user.count({ where: { isPremium: true } })
    const onboardingComplete = await prisma.user.count({ 
      where: { onboardingComplete: true } 
    })

    return {
      total,
      active,
      premium,
      onboardingComplete,
      onboardingRate: total > 0 ? (onboardingComplete / total) * 100 : 0,
    }
  }
}

export const userService = new UserService()
