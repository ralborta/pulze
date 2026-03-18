# Onboarding estructurado para n8n

El onboarding de PULZE recopila datos estructurados que se guardan en la DB para activar flujos de n8n y métricas.

## Bloques del onboarding

### Bloque 1 — Datos iniciales
| Campo    | Tipo   | Ejemplo | Uso n8n              |
|----------|--------|---------|----------------------|
| name     | string | "Raúl"  | Personalización      |
| age      | int    | 48      | Plan por edad        |
| heightCm | int    | 170     | IMC, métricas        |
| weightKg | float  | 75      | IMC, métricas        |

### Bloque 2 — Nivel de actividad
| Campo         | Valores                          |
|---------------|-----------------------------------|
| activityLevel | "sedentario", "ligero", "moderado", "alto" (1-4) |

### Bloque 3 — Restricciones físicas
| Campo        | Ejemplo                    |
|--------------|----------------------------|
| restrictions | "ninguna" o "dolor rodilla" |

### Bloque 4 — Sistema nutricional
| Campo             | Tipo   | Ejemplo              |
|-------------------|--------|----------------------|
| mealsPerDay       | int    | 4                    |
| proteinEnough     | string | "sí", "no", "no_sé"  |
| dietaryRestriction| string | "ninguna", "vegan"   |

### Bloque 5 — Estado actual (baseline)
| Campo        | Tipo | Rango | Uso dashboard "Últimos 7 días" |
|--------------|------|-------|--------------------------------|
| baselineSleep| int  | 1-10  | Sueño inicial                  |
| baselineEnergy| int | 1-10  | Energía inicial                |
| baselineMood | int  | 1-10  | Ánimo inicial                  |

## Tabla User (campos de onboarding)

```
User
├── name, age, heightCm, weightKg
├── activityLevel
├── restrictions
├── mealsPerDay, proteinEnough, dietaryRestriction
├── baselineSleep, baselineEnergy, baselineMood
└── onboardingComplete
```

## Migración

Ejecutar para aplicar los nuevos campos:

```bash
cd packages/database && pnpm exec prisma migrate deploy
```

## n8n

Cuando `onboardingComplete = true`, el usuario tiene todos los datos. Podés:

1. **Webhook** desde PULZE cuando se completa onboarding
2. **Polling** a la API de usuarios con `onboardingComplete: true`
3. **Trigger** por evento en la DB (si tenés listener)

Los campos estructurados permiten:
- Sugerencias automáticas
- Métricas de adherencia
- Plan adaptativo
- Baseline real para el dashboard
