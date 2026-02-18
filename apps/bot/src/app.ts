import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { apiRouter } from './api'

const PORT = process.env.PORT || 3001

async function main() {
  const app = express()
  
  // Middleware
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'pulze-bot-api',
    })
  })

  // API routes
  app.use('/api', apiRouter)

  // Start server
  const port = Number(PORT) || 3001
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 PULZE API running on port ${port}`)
    console.log(`📡 Webhook: http://localhost:${port}/api/webhooks/builderbot`)
    console.log(`❤️  Health: http://localhost:${port}/health`)
  })
}

main().catch((error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})
