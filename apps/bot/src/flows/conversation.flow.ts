import { addKeyword, EVENTS } from '@builderbot/bot';
import { aiService } from '../services/ai.service';

export const conversationFlow = addKeyword(EVENTS.VOICE_NOTE)
  .addAction(async (ctx, { flowDynamic }) => {
    try {
      const response = await aiService.generateResponse(ctx.body, ctx.from);
      await flowDynamic(response);
    } catch (error) {
      await flowDynamic(
        'Disculpa, tuve un problema al procesar tu mensaje. ¿Podrías intentar de nuevo?'
      );
    }
  });

export const generalFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { flowDynamic }) => {
    const message = ctx.body.toLowerCase();
    
    const ignoreKeywords = [
      'hola', 'start', 'comenzar',
      'ayuda', 'help', 'menu',
      'checkin', 'check-in', 'check in'
    ];
    
    const shouldIgnore = ignoreKeywords.some(keyword => message.includes(keyword));
    
    if (shouldIgnore || message.length < 3) {
      return;
    }

    try {
      const response = await aiService.generateResponse(ctx.body, ctx.from);
      await flowDynamic(response);
    } catch (error) {
      await flowDynamic(
        'Disculpa, tuve un problema al procesar tu mensaje. ¿Podrías intentar de nuevo?'
      );
    }
  });
