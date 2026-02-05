import { addKeyword } from '@builderbot/bot';

export const helpFlow = addKeyword(['ayuda', 'help', 'menu'])
  .addAnswer(
    '🤖 Esto es lo que puedo hacer por ti:\n\n' +
    '📊 *Check-in diario*\n' +
    'Escribe "checkin" para hacer tu check-in del día\n\n' +
    '💬 *Conversación libre*\n' +
    'Pregúntame lo que quieras sobre bienestar, nutrición, entrenamiento o hábitos\n\n' +
    '📱 *WebApp*\n' +
    'Visita tu panel personal para ver tu progreso, historial y más\n\n' +
    '🔔 *Recordatorios*\n' +
    'Te enviaré recordatorios diarios para tu check-in\n\n' +
    '¿En qué puedo ayudarte ahora?'
  );
