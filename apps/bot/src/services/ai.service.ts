import OpenAI from 'openai';
import { userService } from './user.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  async generateDailyRecommendation(data: {
    sleep: number;
    energy: number;
    mood: number;
    willTrain: boolean;
    phone: string;
  }) {
    const user = await userService.getUser(data.phone);
    
    const prompt = `Eres PULZE, un coach de bienestar empático y accionable.

Usuario: ${user?.name || 'Usuario'}
Objetivo: ${user?.goal || 'Mejorar bienestar general'}
Restricciones: ${user?.restrictions || 'Ninguna'}

Check-in de hoy:
- Sueño: ${data.sleep}/10
- Energía: ${data.energy}/10
- Ánimo: ${data.mood}/10
- Entrenará hoy: ${data.willTrain ? 'Sí' : 'No'}

Genera una recomendación diaria:
1. Breve análisis de su estado (2 líneas máximo)
2. UNA recomendación accionable específica para hoy (simple y clara)
3. Un micro-plan (1-2 acciones concretas)
4. Una pregunta de seguimiento conversacional

Mantén un tono cercano, motivador pero realista. Máximo 200 palabras.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Eres PULZE, un coach de bienestar que da recomendaciones accionables y empáticas. Hablas en español de forma cercana y motivadora.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'No pude generar una recomendación. Intenta de nuevo.';
  }

  async generateResponse(userMessage: string, phone: string) {
    const user = await userService.getUser(phone);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Eres PULZE, un coach de bienestar personal. Usuario: ${user?.name || 'Usuario'}. Objetivo: ${user?.goal || 'Mejorar bienestar'}. Responde de forma empática, accionable y breve.`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
  }
}

export const aiService = new AIService();
