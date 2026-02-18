import { prisma } from '../client'
import type { CheckIn, Prisma } from '@prisma/client'

export class CheckInService {
  /**
   * Crear un nuevo check-in
   */
  async create(data: Prisma.CheckInCreateInput): Promise<CheckIn> {
    const checkIn = await prisma.checkIn.create({
      data,
      include: {
        user: true,
      },
    })

    // Actualizar estadísticas del usuario
    await this.updateUserStats(checkIn.userId)

    return checkIn
  }

  /**
   * Obtener check-ins de un usuario
   */
  async findByUserId(
    userId: string,
    options?: {
      take?: number
      skip?: number
      orderBy?: Prisma.CheckInOrderByWithRelationInput
    }
  ): Promise<CheckIn[]> {
    return prisma.checkIn.findMany({
      where: { userId },
      take: options?.take,
      skip: options?.skip,
      orderBy: options?.orderBy || { timestamp: 'desc' },
    })
  }

  /**
   * Obtener check-ins de la semana actual
   */
  async getWeekCheckIns(userId: string): Promise<CheckIn[]> {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    startOfWeek.setHours(0, 0, 0, 0)

    return prisma.checkIn.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfWeek,
        },
      },
      orderBy: { timestamp: 'asc' },
    })
  }

  /**
   * Obtener check-ins por rango de fechas
   */
  async getCheckInsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CheckIn[]> {
    return prisma.checkIn.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    })
  }

  /**
   * Verificar si el usuario ya hizo check-in hoy
   */
  async hasCheckInToday(userId: string): Promise<boolean> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        userId,
        timestamp: {
          gte: today,
        },
      },
    })

    return checkIn !== null
  }

  /**
   * Obtener último check-in de un usuario
   */
  async getLastCheckIn(userId: string): Promise<CheckIn | null> {
    return prisma.checkIn.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    })
  }

  /**
   * Calcular racha actual
   */
  async calculateStreak(userId: string): Promise<number> {
    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    })

    if (checkIns.length === 0) return 0

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const checkIn of checkIns) {
      const checkInDate = new Date(checkIn.timestamp)
      checkInDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor(
        (currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === 0 || daysDiff === 1) {
        streak++
        currentDate = checkInDate
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Actualizar estadísticas del usuario basadas en check-ins
   */
  private async updateUserStats(userId: string): Promise<void> {
    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
    })

    const totalCheckIns = checkIns.length
    const averageSleep =
      checkIns.reduce((acc, ci) => acc + ci.sleep, 0) / totalCheckIns
    const averageEnergy =
      checkIns.reduce((acc, ci) => acc + ci.energy, 0) / totalCheckIns
    const trainingDays = checkIns.filter((ci) => ci.trainedToday).length

    const currentStreak = await this.calculateStreak(userId)

    await prisma.userStats.update({
      where: { userId },
      data: {
        totalCheckIns,
        currentStreak,
        averageSleep,
        averageEnergy,
        trainingDays,
        lastActiveDate: new Date(),
      },
    })

    // Actualizar también en User
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { longestStreak: true },
    })

    if (user) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak,
          longestStreak: Math.max(user.longestStreak, currentStreak),
          lastCheckInDate: new Date(),
        },
      })
    }
  }

  /**
   * Obtener estadísticas de check-ins (para backoffice)
   */
  async getStats(days: number = 7) {
    const date = new Date()
    date.setDate(date.getDate() - days)

    const total = await prisma.checkIn.count({
      where: {
        timestamp: {
          gte: date,
        },
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayCount = await prisma.checkIn.count({
      where: {
        timestamp: {
          gte: today,
        },
      },
    })

    return {
      total,
      todayCount,
      period: `${days} días`,
    }
  }
}

export const checkInService = new CheckInService()
