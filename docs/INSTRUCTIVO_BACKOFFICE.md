# Instructivo para usuarios del Backoffice PULZE

Este documento explica cómo cargar y gestionar los datos que alimentan la IA del bot de WhatsApp: **Nutrición**, **Contenidos**, **Planes rutinas** y **Plantillas**.

---

## Índice

1. [Nutrición](#1-nutrición)
2. [Contenidos](#2-contenidos)
3. [Planes rutinas](#3-planes-rutinas)
4. [Plantillas](#4-plantillas)

---

## 1. Nutrición

**Ruta:** Menú lateral → Nutrición

La sección **Nutrición** guarda la base de conocimiento que la IA usa cuando el usuario pregunta sobre alimentación, dieta, macros, proteínas, hidratación, etc.

### Cómo crear un contenido de nutrición

1. Clic en **"Nuevo contenido nutrición"**.
2. Completar los campos:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Título** | Sí | Nombre corto del contenido. Ej: "Guía de macros por objetivo" |
| **Descripción** | Sí | Resumen breve para identificar el contenido |
| **Categoría** | Fija | Siempre "Nutrición" (no se puede cambiar) |
| **Tipo** | Sí | `tip`, `guia` o `articulo` |
| **Tags** | No | Palabras clave separadas por coma. Ej: macros, proteína, hidratación |
| **Contenido** | Sí | Texto completo que la IA usará como referencia |

### Tipos de contenido

- **tip**: consejos breves (ej: "Tomar agua antes de entrenar")
- **guia**: guías más largas (ej: "Cómo calcular tus macros")
- **articulo**: artículos o explicaciones detalladas

### Recomendaciones

- Escribir el contenido en lenguaje claro y directo.
- Incluir recomendaciones concretas (porcentajes, cantidades, ejemplos).
- Usar tags relevantes para que la IA pueda relacionar mejor el contenido con las preguntas.

---

## 2. Contenidos

**Ruta:** Menú lateral → Contenidos

Los **Contenidos** son la base de conocimiento general de la IA. Pueden ser de varias categorías: Entrenamiento, Nutrición, Mentalidad, Bienestar.

> **Nota:** Los contenidos de Nutrición también pueden crearse desde la sección **Nutrición**. La diferencia es que en Contenidos podés elegir cualquier categoría.

### Cómo crear un contenido

1. Clic en **"Nuevo Contenido"**.
2. Completar los campos:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Título** | Sí | Nombre del contenido |
| **Descripción** | Sí | Breve descripción |
| **Categoría** | Sí | Entrenamiento, Nutrición, Mentalidad o Bienestar |
| **Tipo** | Sí | tip, guia, rutina o articulo |
| **Dificultad** | No | Principiante, Intermedio o Avanzado |
| **Duración** | No | Ej: "5 min", "15 min" |
| **Tags** | No | Palabras clave separadas por coma |
| **Contenido** | Sí | Texto completo que la IA usará |

### Categorías disponibles

- **Entrenamiento**: rutinas, ejercicios, tips de entrenamiento
- **Nutrición**: alimentación, macros, hidratación
- **Mentalidad**: motivación, hábitos, mindset
- **Bienestar**: sueño, descanso, recuperación

### Filtros

Podés filtrar por categoría y tipo para encontrar contenidos rápidamente.

---

## 3. Planes rutinas

**Ruta:** Menú lateral → Planes rutinas

Los **Planes rutinas** son plantillas de entrenamiento que la IA adapta según el nivel, restricciones y equipo disponible del usuario. Se usan cuando el usuario dice que va a entrenar en el check-in.

### Cómo crear un plan

1. Clic en **"Nuevo plan"**.
2. Completar los campos:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Título** | Sí | Nombre del plan. Ej: "Rutina full body 15 min" |
| **Descripción** | No | Para uso interno (admin) |
| **Categoría** | Sí | Full body, Cardio, Piernas, Superior, Core, Estiramiento u Otro |
| **Nivel** | Sí | Principiante, Intermedio o Avanzado |
| **Duración** | No | Ej: "15 min", "30 min" |
| **Equipo** | No | Seleccionar los que apliquen (casa, sin equipo, gimnasio, mancuernas, bandas, peso corporal, otro) |
| **Tags** | No | Palabras clave separadas por coma |
| **Contenido** | Sí | Descripción detallada del plan: ejercicios, series, repeticiones, orden, etc. |

### Equipo disponible

- casa
- sin equipo
- gimnasio
- mancuernas
- bandas
- peso corporal
- otro

### Recomendaciones para el contenido del plan

- Indicar ejercicios en orden.
- Incluir series y repeticiones (o tiempo por ejercicio).
- Mencionar descansos entre series.
- Aclarar si hay variantes según nivel.
- La IA adaptará el plan según el usuario (nivel, lesiones, equipo disponible).

---

## 4. Plantillas

**Ruta:** Menú lateral → Plantillas

Las **Plantillas** son mensajes predefinidos que el bot envía en momentos concretos (bienvenida, check-in, resumen semanal, etc.). Podés usar variables que se reemplazan con datos del usuario.

### Cómo crear una plantilla

1. Clic en **"Nueva Plantilla"**.
2. Completar los campos:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Key** | Sí | Identificador único (solo al crear). Ej: `welcome`, `checkin_morning` |
| **Nombre** | Sí | Nombre descriptivo. Ej: "Bienvenida Inicial" |
| **Tipo** | Sí | onboarding, checkin, resumen, reactivacion, felicitacion o general |
| **Variables** | No | Lista de variables separadas por coma. Ej: nombre, racha, logros |
| **Contenido** | Sí | Texto del mensaje. Usar `{{variable}}` para insertar valores |
| **Activa** | Solo al editar | Marcar si la plantilla está en uso |

### Variables disponibles

En el contenido del mensaje podés usar variables con la sintaxis `{{nombre}}`. Ejemplos:

| Variable | Uso |
|----------|-----|
| `{{nombre}}` | Nombre del usuario |
| `{{racha}}` | Días de racha actual |
| `{{logros}}` | Logros o hitos |
| `{{fecha}}` | Fecha actual |
| Otras | Definir en el campo "Variables" según el flujo |

### Tipos de plantilla

- **onboarding**: mensajes de bienvenida o onboarding
- **checkin**: mensajes del check-in diario
- **resumen**: resúmenes semanales o periódicos
- **reactivacion**: mensajes para usuarios inactivos
- **felicitacion**: celebraciones (rachas, logros)
- **general**: otros mensajes automáticos

### Ejemplo de contenido

```
¡Hola {{nombre}}! 👋

Bienvenido/a a PULZE. Tu racha actual es de {{racha}} días. ¡Seguí así!
```

---

## Resumen: qué usa la IA

| Sección | Cuándo lo usa la IA |
|---------|---------------------|
| **Nutrición** | Cuando el usuario pregunta sobre comida, dieta, macros, proteínas, hidratación, etc. |
| **Contenidos** | Según la categoría: Entrenamiento (rutinas, ejercicios), Nutrición (alimentación), Mentalidad, Bienestar |
| **Planes rutinas** | Cuando el usuario indica que va a entrenar en el check-in; la IA adapta un plan según su nivel y equipo |
| **Plantillas** | En momentos específicos del flujo (bienvenida, check-in, resumen, etc.) según la key y el tipo |

---

## Acciones comunes

- **Editar**: pasar el mouse sobre una tarjeta y clic en el ícono de lápiz.
- **Eliminar**: pasar el mouse sobre una tarjeta y clic en el ícono de papelera. Se pedirá confirmación.
- **Buscar**: usar el campo de búsqueda en cada sección.
- **Filtrar**: usar los selectores de categoría, tipo o nivel según la sección.
