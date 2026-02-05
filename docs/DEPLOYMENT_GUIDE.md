# 🚀 Guía de Deployment: Railway + Vercel

## 📋 Resumen

Este documento te guía paso a paso para deployar PULZE en Railway (bot) y Vercel (web + backoffice).

---

## 🚂 PARTE 1: Railway (Bot + Backend)

### 1.1 Crear Proyecto en Railway

**Opción A: Desde la Web (Recomendado)**

1. Ve a https://railway.app/
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu cuenta de GitHub si no lo has hecho
5. Busca y selecciona **`ralborta/pulze`**
6. Railway detectará el monorepo

**Opción B: Desde CLI**

```bash
cd /Users/ralborta/pulze
railway init
# Selecciona: Create new project
# Nombre: pulze
```

### 1.2 Configurar el Servicio del Bot

1. En Railway dashboard, click **"New Service"**
2. Selecciona **"GitHub Repo"** → `ralborta/pulze`
3. Configuración del servicio:
   - **Name**: `pulze-bot`
   - **Root Directory**: `apps/bot`
   - **Build Command**: `pnpm install && pnpm build:bot`
   - **Start Command**: `cd apps/bot && pnpm start`

### 1.3 Agregar PostgreSQL

1. En tu proyecto Railway, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway creará automáticamente la base de datos
3. Railway auto-genera la variable `DATABASE_URL`

### 1.4 Configurar Variables de Entorno

En Railway, ve a tu servicio `pulze-bot` → **Variables**:

```bash
# Copiadas automáticamente de PostgreSQL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# OpenAI (agregar después)
OPENAI_API_KEY=sk-tu-api-key-aqui

# Bot config
BOT_NAME=PULZE Coach
PORT=3001

# JWT (genera uno random)
JWT_SECRET=tu-secret-super-seguro-aqui

# Node env
NODE_ENV=production
```

**Generar JWT_SECRET:**
```bash
# En tu terminal local
openssl rand -base64 32
# Copia el resultado y pégalo en Railway
```

### 1.5 Deploy

1. Railway deployará automáticamente cuando detecte cambios
2. Espera ~2-3 minutos
3. Railway te dará una URL pública (ej: `pulze-bot-production.up.railway.app`)

### 1.6 Verificar

```bash
# Cuando termine el deploy, prueba:
curl https://tu-url-railway.up.railway.app/health

# Deberías ver:
# {"status":"ok","timestamp":"...","service":"pulze-bot"}
```

---

## ⚡ PARTE 2: Vercel (WebApp)

### 2.1 Crear Proyecto Web

**Desde CLI:**

```bash
cd /Users/ralborta/pulze/apps/web
vercel

# Responde:
# Set up and deploy? Yes
# Which scope? ralborta-8414 (tu cuenta)
# Link to existing project? No
# What's your project's name? pulze-web
# In which directory is your code located? ./
# Want to override the settings? No

# Vercel deployará automáticamente
```

**Desde Web:**

1. Ve a https://vercel.com/new
2. Import Git Repository → `ralborta/pulze`
3. Framework: **Next.js**
4. Root Directory: **apps/web**
5. Build Command: `cd ../.. && pnpm install && pnpm build:web`
6. Output Directory: `.next`
7. Click **Deploy**

### 2.2 Variables de Entorno (Web)

En Vercel → tu proyecto `pulze-web` → **Settings** → **Environment Variables**:

```bash
NEXT_PUBLIC_API_URL=https://tu-url-railway.up.railway.app
NEXT_PUBLIC_WEB_URL=https://pulze-web.vercel.app
NEXT_PUBLIC_WHATSAPP_NUMBER=+54911XXXXXXXX
```

---

## ⚡ PARTE 3: Vercel (Backoffice)

### 3.1 Crear Proyecto Backoffice

**Desde CLI:**

```bash
cd /Users/ralborta/pulze/apps/backoffice
vercel

# Responde:
# Set up and deploy? Yes
# Which scope? ralborta-8414
# Link to existing project? No
# What's your project's name? pulze-backoffice
# In which directory is your code located? ./
# Want to override the settings? No
```

**Desde Web:**

1. Ve a https://vercel.com/new
2. Import → `ralborta/pulze`
3. Framework: **Next.js**
4. Root Directory: **apps/backoffice**
5. Build Command: `cd ../.. && pnpm install && pnpm build:backoffice`
6. Output Directory: `.next`
7. Click **Deploy**

### 3.2 Variables de Entorno (Backoffice)

```bash
NEXT_PUBLIC_API_URL=https://tu-url-railway.up.railway.app
```

---

## 🔧 PARTE 4: Configuración Post-Deploy

### 4.1 Migrar Base de Datos

Desde tu local, conecta a Railway y corre las migraciones:

```bash
# Copia el DATABASE_URL de Railway
export DATABASE_URL="postgresql://..."

# Corre migraciones
cd packages/database
pnpm migrate

# O directamente:
pnpm db:push
```

### 4.2 Obtener OpenAI API Key

1. Ve a https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Nombre: `PULZE Production`
4. Copia la key (empieza con `sk-...`)
5. Agrégala en Railway → Variables → `OPENAI_API_KEY`
6. Railway redesplegará automáticamente

### 4.3 Conectar WhatsApp (Baileys)

1. Cuando Railway despliegue, ve a los **Logs**
2. Verás un QR code en los logs (puede tardar 1-2 min)
3. Escanéalo con WhatsApp:
   - Abre WhatsApp en tu teléfono
   - Ve a Configuración → Dispositivos vinculados
   - Escanea el QR

4. Una vez conectado, envía "hola" para probar

**Importante**: Baileys guarda la sesión. No necesitas escanear QR cada vez.

---

## 📊 PARTE 5: Verificación Final

### Checklist:

```bash
# ✅ Railway
□ Proyecto creado
□ PostgreSQL agregado
□ Variables configuradas
□ Deploy exitoso
□ /health responde OK
□ WhatsApp conectado

# ✅ Vercel Web
□ Proyecto creado
□ Variables configuradas
□ Deploy exitoso
□ Sitio accesible

# ✅ Vercel Backoffice
□ Proyecto creado
□ Variables configuradas
□ Deploy exitoso
□ Dashboard accesible

# ✅ Integración
□ Web puede llamar a API de Railway
□ Backoffice puede llamar a API de Railway
```

### URLs Finales:

```
Bot API:      https://pulze-bot-production.up.railway.app
WebApp:       https://pulze-web.vercel.app
Backoffice:   https://pulze-backoffice.vercel.app
GitHub:       https://github.com/ralborta/pulze
```

---

## 🔄 PARTE 6: CI/CD Automático (Opcional)

### 6.1 GitHub Secrets

Para que los deploys sean automáticos con cada push:

1. Ve a GitHub → `ralborta/pulze` → **Settings** → **Secrets and variables** → **Actions**

2. Agrega estos secrets:

```bash
# Railway
RAILWAY_TOKEN=<obtener de railway.app/account/tokens>

# Vercel
VERCEL_TOKEN=<obtener de vercel.com/account/tokens>
VERCEL_ORG_ID=<tu org id>
VERCEL_WEB_PROJECT_ID=<id del proyecto web>
VERCEL_BACKOFFICE_PROJECT_ID=<id del proyecto backoffice>
```

### 6.2 Obtener Tokens

**Railway Token:**
```bash
railway login
railway tokens
# O desde: https://railway.app/account/tokens
```

**Vercel Token:**
```bash
vercel login
# Luego: https://vercel.com/account/tokens
```

**Project IDs:**
```bash
# Desde vercel.com → tu proyecto → Settings → General
# Copia "Project ID"
```

### 6.3 Probar CI/CD

```bash
# Hacer un cambio
echo "# Test" >> README.md
git add .
git commit -m "test: CI/CD"
git push

# Ve a GitHub → Actions
# Deberías ver el workflow corriendo
```

---

## 🆘 Troubleshooting

### Railway: Bot no inicia

```bash
# Verifica logs en Railway
railway logs

# Problemas comunes:
# 1. DATABASE_URL no configurado
# 2. OPENAI_API_KEY faltante (el bot arrancará igual)
# 3. Build command incorrecto
```

### Vercel: Build falla

```bash
# Verifica en Vercel → tu proyecto → Deployments → Log

# Problemas comunes:
# 1. Root directory incorrecto
# 2. Build command no encuentra pnpm
# 3. Variables de entorno faltantes
```

### WhatsApp: QR no aparece

```bash
# En Railway logs:
railway logs --tail

# Si no ves el QR:
# 1. Espera 2-3 minutos (el bot está iniciando)
# 2. Verifica que BaileysProvider esté configurado
# 3. Borra la sesión y reinicia:
#    Railway → Service → Restart
```

### Base de datos: Migración falla

```bash
# Conecta local con Railway DB
railway run pnpm db:migrate

# O empuja sin migración:
railway run pnpm db:push
```

---

## 📱 PARTE 7: Primeros Pasos Post-Deploy

### 7.1 Probar el Bot

1. Una vez conectado WhatsApp, envía: **"hola"**
2. El bot debería iniciar onboarding
3. Completa el onboarding

### 7.2 Ver en WebApp

1. Abre `https://pulze-web.vercel.app`
2. Deberías ver el landing
3. Click "Ver mi Dashboard" (aún no conectado con API)

### 7.3 Ver en Backoffice

1. Abre `https://pulze-backoffice.vercel.app`
2. Deberías ver el dashboard admin
3. Los datos aún son mock (próximo paso: conectar con API)

---

## ✅ ¡Deploy Completado!

Tu stack está corriendo:

```
┌─────────────────────────────────────┐
│     USUARIOS (WhatsApp + Web)       │
└─────────────────────────────────────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│   VERCEL    │   │   RAILWAY   │
│  Web + BO   │◄─►│  Bot + API  │
│             │   │             │
└─────────────┘   └─────┬───────┘
                        │
                        ▼
                  [PostgreSQL]
```

**Siguiente paso**: Conectar frontend con backend (fetch API desde React)

---

## 📞 Comandos Rápidos

```bash
# Ver logs de Railway
railway logs --tail

# Redeploy en Railway
railway up

# Deploy en Vercel
cd apps/web && vercel --prod
cd apps/backoffice && vercel --prod

# Ver variables en Railway
railway variables

# Ver status
railway status
vercel ls
```

---

## 🎓 Recursos

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [BuilderBot Docs](https://builderbot.app/)
- [Tu GitHub](https://github.com/ralborta/pulze)

**¡Tu proyecto PULZE está en producción!** 🚀
