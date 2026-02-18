"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInService = exports.CheckInService = void 0;
const client_1 = require("../client");
class CheckInService {
    /**
     * Crear un nuevo check-in
     */
    async create(data) {
        const checkIn = await client_1.prisma.checkIn.create({
            data,
            include: {
                user: true,
            },
        });
        // Actualizar estadísticas del usuario
        await this.updateUserStats(checkIn.userId);
        return checkIn;
    }
    /**
     * Obtener check-ins de un usuario
     */
    async findByUserId(userId, options) {
        return client_1.prisma.checkIn.findMany({
            where: { userId },
            take: options?.take,
            skip: options?.skip,
            orderBy: options?.orderBy || { timestamp: 'desc' },
        });
    }
    /**
     * Obtener check-ins de la semana actual
     */
    async getWeekCheckIns(userId) {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        return client_1.prisma.checkIn.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startOfWeek,
                },
            },
            orderBy: { timestamp: 'asc' },
        });
    }
    /**
     * Verificar si el usuario ya hizo check-in hoy
     */
    async hasCheckInToday(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkIn = await client_1.prisma.checkIn.findFirst({
            where: {
                userId,
                timestamp: {
                    gte: today,
                },
            },
        });
        return checkIn !== null;
    }
    /**
     * Obtener último check-in de un usuario
     */
    async getLastCheckIn(userId) {
        return client_1.prisma.checkIn.findFirst({
            where: { userId },
            orderBy: { timestamp: 'desc' },
        });
    }
    /**
     * Calcular racha actual
     */
    async calculateStreak(userId) {
        const checkIns = await client_1.prisma.checkIn.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            select: { timestamp: true },
        });
        if (checkIns.length === 0)
            return 0;
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        for (const checkIn of checkIns) {
            const checkInDate = new Date(checkIn.timestamp);
            checkInDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 0 || daysDiff === 1) {
                streak++;
                currentDate = checkInDate;
            }
            else {
                break;
            }
        }
        return streak;
    }
    /**
     * Actualizar estadísticas del usuario basadas en check-ins
     */
    async updateUserStats(userId) {
        const checkIns = await client_1.prisma.checkIn.findMany({
            where: { userId },
        });
        const totalCheckIns = checkIns.length;
        const averageSleep = checkIns.reduce((acc, ci) => acc + ci.sleep, 0) / totalCheckIns;
        const averageEnergy = checkIns.reduce((acc, ci) => acc + ci.energy, 0) / totalCheckIns;
        const trainingDays = checkIns.filter((ci) => ci.trainedToday).length;
        const currentStreak = await this.calculateStreak(userId);
        await client_1.prisma.userStats.update({
            where: { userId },
            data: {
                totalCheckIns,
                currentStreak,
                averageSleep,
                averageEnergy,
                trainingDays,
                lastActiveDate: new Date(),
            },
        });
        // Actualizar también en User
        const user = await client_1.prisma.user.findUnique({
            where: { id: userId },
            select: { longestStreak: true },
        });
        if (user) {
            await client_1.prisma.user.update({
                where: { id: userId },
                data: {
                    currentStreak,
                    longestStreak: Math.max(user.longestStreak, currentStreak),
                    lastCheckInDate: new Date(),
                },
            });
        }
    }
    /**
     * Obtener estadísticas de check-ins (para backoffice)
     */
    async getStats(days = 7) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const total = await client_1.prisma.checkIn.count({
            where: {
                timestamp: {
                    gte: date,
                },
            },
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await client_1.prisma.checkIn.count({
            where: {
                timestamp: {
                    gte: today,
                },
            },
        });
        return {
            total,
            todayCount,
            period: `${days} días`,
        };
    }
}
exports.CheckInService = CheckInService;
exports.checkInService = new CheckInService();
