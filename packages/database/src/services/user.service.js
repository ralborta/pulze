"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const client_1 = require("../client");
class UserService {
    /**
     * Crear un nuevo usuario (durante onboarding)
     */
    async create(data) {
        const user = await client_1.prisma.user.create({
            data,
            include: {
                preferences: true,
                stats: true,
            },
        });
        // Crear UserStats y UserPreferences por defecto
        await client_1.prisma.userStats.create({
            data: { userId: user.id },
        });
        await client_1.prisma.userPreferences.create({
            data: { userId: user.id },
        });
        return user;
    }
    /**
     * Buscar usuario por teléfono (WhatsApp)
     */
    async findByPhone(phone) {
        return client_1.prisma.user.findUnique({
            where: { phone },
            include: {
                preferences: true,
                stats: true,
            },
        });
    }
    /**
     * Buscar usuario por ID
     */
    async findById(id) {
        return client_1.prisma.user.findUnique({
            where: { id },
            include: {
                preferences: true,
                stats: true,
                checkIns: {
                    orderBy: { timestamp: 'desc' },
                    take: 7, // Últimos 7 check-ins
                },
            },
        });
    }
    /**
     * Actualizar datos del usuario
     */
    async update(id, data) {
        return client_1.prisma.user.update({
            where: { id },
            data,
        });
    }
    /**
     * Actualizar racha del usuario
     */
    async updateStreak(userId, currentStreak) {
        const user = await client_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        const longestStreak = Math.max(user.longestStreak, currentStreak);
        await client_1.prisma.user.update({
            where: { id: userId },
            data: {
                currentStreak,
                longestStreak,
                lastCheckInDate: new Date(),
            },
        });
        await client_1.prisma.userStats.update({
            where: { userId },
            data: {
                currentStreak,
                longestStreak,
                lastActiveDate: new Date(),
            },
        });
    }
    /**
     * Marcar onboarding como completo
     */
    async completeOnboarding(userId) {
        return client_1.prisma.user.update({
            where: { id: userId },
            data: { onboardingComplete: true },
        });
    }
    /**
     * Obtener usuarios activos (para métricas)
     */
    async getActiveUsers(days = 7) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return client_1.prisma.user.findMany({
            where: {
                isActive: true,
                lastCheckInDate: {
                    gte: date,
                },
            },
            include: {
                stats: true,
            },
        });
    }
    /**
     * Obtener usuarios inactivos (para reactivación)
     */
    async getInactiveUsers(days = 2) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return client_1.prisma.user.findMany({
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
        });
    }
    /**
     * Obtener estadísticas generales
     */
    async getStats() {
        const total = await client_1.prisma.user.count();
        const active = await client_1.prisma.user.count({ where: { isActive: true } });
        const premium = await client_1.prisma.user.count({ where: { isPremium: true } });
        const onboardingComplete = await client_1.prisma.user.count({
            where: { onboardingComplete: true }
        });
        return {
            total,
            active,
            premium,
            onboardingComplete,
            onboardingRate: total > 0 ? (onboardingComplete / total) * 100 : 0,
        };
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
