import { addKeyword, EVENTS } from '@builderbot/bot';
import { aiService } from '../services/ai.service';
import { userService } from '../services/user.service';

export const welcomeFlow = addKeyword(EVENTS.WELCOME)
  .addAnswer(
    '¡Hola! 👋 Soy PULZE, tu coach de bienestar personal.',
    { delay: 500 }
  )
  .addAnswer(
    'Estoy aquí para acompañarte en tu camino hacia una vida más saludable, con pequeños pasos diarios que hacen la diferencia.',
    { delay: 1000 }
  )
  .addAnswer(
    'Para empezar, necesito conocerte un poco. ¿Cuál es tu nombre?',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const userName = ctx.body;
      state.update({ userName });
      
      await flowDynamic(`Encantado de conocerte, ${userName}! 😊`);
      await flowDynamic('¿Cuál es tu objetivo principal?');
      await flowDynamic(
        'Por ejemplo:\n' +
        '• Bajar de peso\n' +
        '• Ganar músculo\n' +
        '• Mejorar mi energía\n' +
        '• Desarrollar hábitos saludables\n' +
        '• Mejorar mi descanso'
      );
    }
  )
  .addAnswer(
    'Cuéntame tu objetivo:',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const goal = ctx.body;
      const userName = state.get('userName');
      
      state.update({ goal });

      await flowDynamic('Perfecto! 🎯');
      await flowDynamic(
        '¿Tienes alguna restricción o condición que deba considerar?\n' +
        '(lesiones, alergias, limitaciones de tiempo, etc.)\n\n' +
        'Si no tienes ninguna, escribe "ninguna"'
      );
    }
  )
  .addAnswer(
    null,
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const restrictions = ctx.body.toLowerCase() === 'ninguna' ? null : ctx.body;
      const userName = state.get('userName');
      const goal = state.get('goal');
      
      try {
        await userService.createUser({
          phone: ctx.from,
          name: userName,
          goal,
          restrictions,
        });

        await flowDynamic(`¡Excelente, ${userName}! ✅`);
        await flowDynamic(
          'Ya estás registrado. A partir de mañana te enviaré un check-in diario muy corto (toma solo 30 segundos).'
        );
        await flowDynamic(
          'Con tus respuestas, te daré recomendaciones personalizadas y un micro-plan de acción.'
        );
        await flowDynamic(
          'Mientras tanto, puedes:\n' +
          '• Escribir "ayuda" para ver qué puedo hacer\n' +
          '• Preguntarme cualquier duda sobre bienestar\n' +
          '• Contarme cómo fue tu día'
        );

      } catch (error) {
        await flowDynamic(
          'Hubo un error al registrarte. Por favor, intenta más tarde o contacta a soporte.'
        );
      }
    }
  );
