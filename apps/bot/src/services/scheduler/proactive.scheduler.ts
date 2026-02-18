import * as cron from 'node-cron'
import { prisma, userService } from '@pulze/database'
import { patternAnalyzer } from '../ai/pattern-analyzer.service'
import { promptBuilderService } from '../ai/prompt-builder.service'
import { builderBotClient } from '../builderbot'
import { aiService } from '../ai/ai.service'

/**
 * ProactiveScheduler - Sistema de mensajes proactivos inteligentes
 * 
 * Detecta automáticamente cuando enviar mensajes a usuarios:
 * - Check-in reminders (si no respondió hoy)
 * - Reactivación (2+ días sin actividad)
 * - Celebraciones de racha (hitos alcanzados)
 * - Follow-ups (progreso notable)
 */
export class ProactiveScheduler {
  private jobs: cron.ScheduledTask[] = []

  /**
   * Iniciar todos los cron jobs
   */
  start() {
    console.log('[ProactiveScheduler] Iniciando scheduler...')

    // Job 1: Check-in reminders (cada hora de 8 AM a 10 PM)
    this.jobs.push(
      cron.schedule('0 8-22 * * *', () => this.processCheckInReminders(), {
        timezone: 'America/Argentina/Buenos_Aires',
      })
    )

    // Job 2: Reactivación diaria (10 AM)
    this.jobs.push(
      cron.schedule('0 10 * * *', () => this.processReactivations(), {
        timezone: 'America/Argentina/Buenos_Aires',
      })
    )

    // Job 3: Celebraciones de racha (6 PM)
    this.jobs.push(
      cron.schedule('0 18 * * *', () => this.processCelebrations(), {
        timezone: 'America/Argentina/Buenos_Aires',
      })
    )

    console.log(`[ProactiveScheduler] ${this.jobs.length} jobs programados`)
  }

  /**
   * Detener todos los jobs
   */
  stop() {
    this.jobs.forEach(job => job.stop())
    console.log('[ProactiveScheduler] Scheduler detenido')
  }

  /**
   * Procesar recordatorios de check-in
   * (usuarios que NO hicieron check-in hoy y es su horario preferido)
   */
  private async processCheckInReminders() {
    try {
      console.log('[ProactiveScheduler] Procesando check-in reminders...')

      // Obtener usuarios activos sin check-in hoy
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          onboardingComplete: true,
        },
        include: {
          preferences: true,
          stats: true,
          checkIns: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      })

      const currentHour = new Date().getHours()
      let sentCount = 0

      for (const user of users) {
        // Verificar si ya hizo check-in hoy
        const lastCheckIn = user.checkIns[0]
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (lastCheckIn && lastCheckIn.timestamp >= today) {
          continue // Ya hizo check-in hoy
        }

        // Verificar si es su horario preferido
        const preferredTime = user.preferences?.reminderTime || '08:00'
        const preferredHour = parseInt(preferredTime.split(':')[0])

        if (currentHour === preferredHour) {
          await this.sendCheckInReminder(user)
          sentCount++
        }
      }

      console.log(`[ProactiveScheduler] Enviados ${sentCount} check-in reminders`)
    } catch (error) {
      console.error('[ProactiveScheduler] Error procesando check-in reminders:', error)
    }
  }

  /**
   * Procesar reactivaciones
   * (usuarios con 2+ días sin check-in)
   */
  private async processReactivations() {
    try {
      console.log('[ProactiveScheduler] Procesando reactivaciones...')

      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          onboardingComplete: true,
          OR: [
            { lastCheckInDate: { lt: twoDaysAgo } },
            { lastCheckInDate: null },
          ],
        },
        include: {
          preferences: true,
          stats: true,
          checkIns: {
            orderBy: { timestamp: 'desc' },
            take: 7,
          },
        },
      })

      let sentCount = 0

      for (const user of users) {
        // Calcular días sin check-in
        const daysSinceLastCheckIn = user.lastCheckInDate
          ? Math.floor(
              (Date.now() - user.lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 999

        // Solo enviar si tiene entre 2 y 7 días sin check-in
        // (más de 7 días = probablemente abandonó)
        if (daysSinceLastCheckIn >= 2 && daysSinceLastCheckIn <= 7) {
          await this.sendReactivationMessage(user, daysSinceLastCheckIn)
          sentCount++
        }
      }

      console.log(`[ProactiveScheduler] Enviados ${sentCount} mensajes de reactivación`)
    } catch (error) {
      console.error('[ProactiveScheduler] Error procesando reactivaciones:', error)
    }
  }

  /**
   * Procesar celebraciones
   * (rachas de 7, 14, 21, 30 días)
   */
  private async processCelebrations() {
    try {
      console.log('[ProactiveScheduler] Procesando celebraciones...')

      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          currentStreak: { in: [7, 14, 21, 30, 60, 90] }, // Hitos importantes
        },
        include: {
          preferences: true,
          stats: true,
        },
      })

      let sentCount = 0

      for (const user of users) {
        // Verificar si ya celebramos este hito hoy
        const celebratedToday = await prisma.proactiveMessage.findFirst({
          where: {
            userId: user.id,
            messageType: 'celebration',
            sentAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        })

        if (!celebratedToday) {
          await this.sendCelebrationMessage(user)
          sentCount++
        }
      }

      console.log(`[ProactiveScheduler] Enviados ${sentCount} mensajes de celebración`)
    } catch (error) {
      console.error('[ProactiveScheduler] Error procesando celebraciones:', error)
    }
  }

  /**
   * Enviar recordatorio de check-in
   */
  private async sendCheckInReminder(user: any) {
    try {
      const message = `Hola ${user.name} 👋

Es hora de tu check-in diario. ¿Cómo amaneciste hoy?

Responde con 3 números rápidos:
1️⃣ Sueño (1-5)
2️⃣ Energía (1-5)  
3️⃣ Ánimo (una palabra)

Ejemplo: 4, 3, bien`

      // Enviar vía BuilderBot
      await builderBotClient.sendMessage({
        phone: user.phone,
        message,
      })

      // Registrar mensaje proactivo
      await prisma.proactiveMessage.create({
        data: {
          userId: user.id,
          messageType: 'checkin_reminder',
          content: message,
          status: 'sent',
          sentAt: new Date(),
        },
      })

      console.log(`[ProactiveScheduler] Check-in reminder enviado a ${user.name}`)
    } catch (error) {
      console.error(`[ProactiveScheduler] Error enviando reminder a ${user.name}:`, error)
    }
  }

  /**
   * Enviar mensaje de reactivación
   */
  private async sendReactivationMessage(user: any, daysSinceLastCheckIn: number) {
    try {
      // Generar mensaje personalizado con GPT-4
      const { system, user: userPrompt } = promptBuilderService.buildReactivationPrompt(
        user,
        daysSinceLastCheckIn
      )

      const result = await aiService.generateCoachResponse(
        userPrompt,
        system,
        []
      )

      const message = result.content

      // Enviar vía BuilderBot
      await builderBotClient.sendMessage({
        phone: user.phone,
        message,
      })

      // Registrar mensaje proactivo
      await prisma.proactiveMessage.create({
        data: {
          userId: user.id,
          messageType: 'reactivation',
          content: message,
          status: 'sent',
          sentAt: new Date(),
          contextSnapshot: {
            daysSinceLastCheckIn,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
          },
        },
      })

      console.log(`[ProactiveScheduler] Reactivación enviada a ${user.name} (${daysSinceLastCheckIn} días sin check-in)`)
    } catch (error) {
      console.error(`[ProactiveScheduler] Error enviando reactivación a ${user.name}:`, error)
    }
  }

  /**
   * Enviar mensaje de celebración
   */
  private async sendCelebrationMessage(user: any) {
    try {
      const streak = user.currentStreak

      let message = `🔥 ¡INCREÍBLE ${user.name.toUpperCase()}! 🔥

Acabás de completar ${streak} días seguidos 🎉

`

      // Mensaje personalizado según el hito
      if (streak === 7) {
        message += `Tu primera semana completa. Esto es solo el comienzo 💪

¿Cómo te sentís con este logro?`
      } else if (streak === 14) {
        message += `2 semanas de constancia pura. Ya no es suerte, es hábito 🌟

¿Qué cambios notaste en vos?`
      } else if (streak === 21) {
        message += `21 días. El punto donde un hábito se vuelve parte de tu vida 🚀

¿Cuál fue la clave para llegar hasta acá?`
      } else if (streak === 30) {
        message += `UN MES ENTERO. Oficialmente sos imparable 👑

¿Dónde te ves en el próximo mes?`
      } else if (streak >= 60) {
        message += `${streak} días de constancia. Esto ya es nivel LEYENDA 👏

Estás en el top 1% de usuarios de PULZE.`
      }

      // Enviar vía BuilderBot
      await builderBotClient.sendMessage({
        phone: user.phone,
        message,
      })

      // Registrar mensaje proactivo
      await prisma.proactiveMessage.create({
        data: {
          userId: user.id,
          messageType: 'celebration',
          content: message,
          status: 'sent',
          sentAt: new Date(),
          contextSnapshot: {
            streak,
            milestone: streak,
          },
        },
      })

      console.log(`[ProactiveScheduler] Celebración enviada a ${user.name} (${streak} días)`)
    } catch (error) {
      console.error(`[ProactiveScheduler] Error enviando celebración a ${user.name}:`, error)
    }
  }
}

export const proactiveScheduler = new ProactiveScheduler()
