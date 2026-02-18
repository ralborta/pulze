"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentService = exports.ContentService = void 0;
const client_1 = require("../client");
class ContentService {
    /**
     * Crear nuevo contenido
     */
    async create(data) {
        return client_1.prisma.content.create({ data });
    }
    /**
     * Obtener contenidos por categoría
     */
    async findByCategory(category) {
        return client_1.prisma.content.findMany({
            where: {
                category,
                isActive: true,
            },
            orderBy: { viewCount: 'desc' },
        });
    }
    /**
     * Obtener contenidos por tipo
     */
    async findByType(type) {
        return client_1.prisma.content.findMany({
            where: {
                type,
                isActive: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Buscar contenidos por tags
     */
    async findByTags(tags) {
        return client_1.prisma.content.findMany({
            where: {
                tags: {
                    hasSome: tags,
                },
                isActive: true,
            },
        });
    }
    /**
     * Obtener contenido por ID y actualizar contador de vistas
     */
    async findByIdAndView(id) {
        await client_1.prisma.content.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        });
        return client_1.prisma.content.findUnique({ where: { id } });
    }
    /**
     * Obtener contenidos más populares
     */
    async getMostViewed(limit = 10) {
        return client_1.prisma.content.findMany({
            where: { isActive: true },
            orderBy: { viewCount: 'desc' },
            take: limit,
        });
    }
    /**
     * Actualizar contenido
     */
    async update(id, data) {
        return client_1.prisma.content.update({
            where: { id },
            data,
        });
    }
    /**
     * Eliminar contenido (soft delete)
     */
    async delete(id) {
        return client_1.prisma.content.update({
            where: { id },
            data: { isActive: false },
        });
    }
    /**
     * Obtener todos los contenidos (para backoffice)
     */
    async findAll(filters) {
        return client_1.prisma.content.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Obtener estadísticas de contenidos
     */
    async getStats() {
        const total = await client_1.prisma.content.count();
        const byCategory = await client_1.prisma.content.groupBy({
            by: ['category'],
            _count: true,
            where: { isActive: true },
        });
        const mostViewed = await this.getMostViewed(5);
        return {
            total,
            byCategory,
            mostViewed: mostViewed.map((c) => ({
                title: c.title,
                views: c.viewCount,
            })),
        };
    }
}
exports.ContentService = ContentService;
exports.contentService = new ContentService();
