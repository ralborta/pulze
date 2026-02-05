import { addKeyword } from '@builderbot/bot';
import { checkInService } from '../services/checkin.service';
import { aiService } from '../services/ai.service';

export const checkInFlow = addKeyword(['checkin', 'check-in', 'check in'])
  .addAnswer(
    '📊 Check-in diario',
    { delay: 300 }
  )
  .addAnswer(
    'Del 1 al 10, ¿cómo dormiste anoche?\n(1 = pésimo, 10 = excelente)',
    { capture: true },
    async (ctx, { state }) => {
      const sleep = parseInt(ctx.body);
      state.update({ sleep });
    }
  )
  .addAnswer(
    '¿Y tu nivel de energía hoy?\n(1 = sin energía, 10 = full energía)',
    { capture: true },
    async (ctx, { state }) => {
      const energy = parseInt(ctx.body);
      state.update({ energy });
    }
  )
  .addAnswer(
    '¿Cómo está tu ánimo?\n(1 = muy bajo, 10 = excelente)',
    { capture: true },
    async (ctx, { state }) => {
      const mood = parseInt(ctx.body);
      state.update({ mood });
    }
  )
  .addAnswer(
    '¿Vas a entrenar hoy? (sí/no)',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const willTrain = ctx.body.toLowerCase();
      const sleep = state.get('sleep');
      const energy = state.get('energy');
      const mood = state.get('mood');

      try {
        await checkInService.saveCheckIn({
          phone: ctx.from,
          sleep,
          energy,
          mood,
          willTrain: willTrain.includes('si') || willTrain.includes('sí'),
        });

        await flowDynamic('¡Gracias! Procesando tu check-in... 🤔');

        const recommendation = await aiService.generateDailyRecommendation({
          sleep,
          energy,
          mood,
          willTrain: willTrain.includes('si') || willTrain.includes('sí'),
          phone: ctx.from,
        });

        await flowDynamic('🎯 Recomendación del día:');
        await flowDynamic(recommendation);

      } catch (error) {
        await flowDynamic(
          'Hubo un error al procesar tu check-in. Por favor, intenta de nuevo.'
        );
      }
    }
  );
