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
  try {
    const provider = createProvider(BaileysProvider);
    
    const database = new MemoryDB();

    await createBot({
      flow: createFlow(flowManager.getAllFlows()),
      provider,
      database,
    });

    const app = express();
    
    app.use(cors());
    app.use(express.json());
    
    app.use('/api', apiRouter);
    
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'pulze-bot'
      });
    });

    schedulerService.start();

    app.listen(PORT, () => {
      logger.info(`🚀 PULZE Bot + API running on port ${PORT}`);
      logger.info(`📱 Scan QR code to connect WhatsApp`);
    });

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
