import { Router } from 'express'

// Import routes
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import checkInRoutes from './routes/checkin.routes'
import contentRoutes from './routes/content.routes'
import preferencesRoutes from './routes/preferences.routes'
import adminRoutes from './routes/admin.routes'
import webhookRoutes from './routes/webhook.routes'

export const apiRouter = Router()

/**
 * Health check
 */
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'pulze-api',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Mount routes
 */
apiRouter.use('/auth', authRoutes)
apiRouter.use('/users', userRoutes)
apiRouter.use('/check-ins', checkInRoutes)
apiRouter.use('/contents', contentRoutes)
apiRouter.use('/preferences', preferencesRoutes)
apiRouter.use('/admin', adminRoutes)
apiRouter.use('/webhooks', webhookRoutes)

/**
 * 404 handler
 */
apiRouter.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
  })
})

