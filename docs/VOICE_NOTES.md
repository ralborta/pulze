# Notas de Voz en BuilderBot

## ✅ BuilderBot maneja notas de voz automáticamente

BuilderBot ya incluye soporte nativo para mensajes de voz sin necesidad de implementación adicional.

### Cómo funciona:

1. **Transcripción automática**: BuilderBot convierte automáticamente las notas de voz en texto
2. **Evento VOICE_NOTE**: Detecta cuando un usuario envía una nota de voz
3. **Procesamiento**: El texto transcrito llega en `ctx.body` listo para usar

### Implementación en PULZE:

```typescript
// conversation.flow.ts
export const conversationFlow = addKeyword(EVENTS.VOICE_NOTE)
  .addAction(async (ctx, { flowDynamic }) => {
    // ctx.body contiene el texto transcrito automáticamente
    const response = await aiService.generateResponse(ctx.body, ctx.from);
    await flowDynamic(response);
  });
```

### Ventajas:

- ✅ **Sin configuración adicional**: No necesitas Whisper API
- ✅ **Ahorro de costos**: No pagas por transcripciones
- ✅ **Más rápido**: La transcripción es instantánea
- ✅ **Menos complejidad**: Menos código, menos bugs

### Lo que el usuario puede hacer:

1. Enviar nota de voz con pregunta sobre bienestar
2. BuilderBot transcribe automáticamente
3. PULZE procesa el texto con IA
4. Usuario recibe respuesta personalizada

### Ejemplo de flujo:

```
Usuario: [🎤 Nota de voz: "Hola PULZE, tengo mucho cansancio hoy"]
         ↓
BuilderBot transcribe → "Hola PULZE, tengo mucho cansancio hoy"
         ↓
AI genera respuesta → "Entiendo que estás cansado. ¿Dormiste bien anoche?..."
         ↓
Usuario recibe respuesta por texto
```

### No necesitas:

- ❌ OpenAI Whisper API
- ❌ Procesamiento manual de audio
- ❌ Conversión de formatos
- ❌ Gestión de archivos temporales

**BuilderBot lo hace todo por ti** 🚀
