import 'dotenv/config';
import { createBot, createProvider, createFlow, MemoryDB } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import express from 'express';
import cors from 'cors';
import { flowManager } from './flows';
import { apiRouter } from './api';
import { schedulerService } from './services/scheduler.service';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'pulze-bot',
    });
  });

  app.use('/api', apiRouter);

  // Escuchar en 0.0.0.0 para que el healthcheck desde fuera del contenedor llegue
  const port = Number(PORT) || 3001;
  app.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 PULZE Bot + API running on port ${port}`);
  });

  try {
    const provider = createProvider(BaileysProvider);
    const database = new MemoryDB();

    await createBot({
      flow: createFlow(flowManager.getAllFlows()),
      provider,
      database,
    });

    schedulerService.start();
    logger.info(`📱 Scan QR code to connect WhatsApp`);
  } catch (error) {
    logger.error('Failed to start bot:', error);
    // No exit(1): el servidor HTTP sigue vivo para /health y /api
  }
}

main();
