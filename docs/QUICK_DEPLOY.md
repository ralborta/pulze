# 🚀 Quick Deploy - Comandos Rápidos

## Para usuarios que prefieren CLI

### 🚂 Railway (Bot)

```bash
# 1. Crear proyecto (hazlo desde la web es más fácil)
# https://railway.app/new

# 2. Link con tu proyecto local
cd /Users/ralborta/pulze
railway link

# 3. Agregar PostgreSQL desde railway.app

# 4. Configurar variables
railway variables set OPENAI_API_KEY=sk-tu-key
railway variables set BOT_NAME="PULZE Coach"
railway variables set PORT=3001
railway variables set NODE_ENV=production

# Generar JWT secret
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# 5. Deploy
cd apps/bot
railway up

# 6. Ver logs
railway logs --tail
```

---

### ⚡ Vercel (Web)

```bash
# 1. Deploy Web
cd /Users/ralborta/pulze/apps/web
vercel

# Respuestas:
# - Set up and deploy? Y
# - Link to existing? N
# - Project name: pulze-web
# - Directory: ./
# - Override settings? N

# 2. Configurar variables (después del primer deploy)
vercel env add NEXT_PUBLIC_API_URL production
# Pega: https://tu-railway-url.up.railway.app

vercel env add NEXT_PUBLIC_WEB_URL production  
# Pega: https://pulze-web.vercel.app

# 3. Redeploy con variables
vercel --prod
```

---

### ⚡ Vercel (Backoffice)

```bash
# 1. Deploy Backoffice
cd /Users/ralborta/pulze/apps/backoffice
vercel

# Respuestas:
# - Set up and deploy? Y
# - Link to existing? N
# - Project name: pulze-backoffice
# - Directory: ./
# - Override settings? N

# 2. Configurar variables
vercel env add NEXT_PUBLIC_API_URL production
# Pega: https://tu-railway-url.up.railway.app

# 3. Redeploy
vercel --prod
```

---

## 📋 Checklist Rápido

```bash
# Railway
□ Proyecto creado en railway.app
□ PostgreSQL agregado
□ Variables configuradas
□ Bot deployado
□ WhatsApp conectado (escanear QR en logs)

# Vercel
□ pulze-web deployado
□ pulze-backoffice deployado
□ Variables configuradas
□ Sitios accesibles
```

---

## 🔑 Variables Necesarias

### Railway (Bot)
```
DATABASE_URL           (auto desde PostgreSQL)
OPENAI_API_KEY        (obtener de openai.com)
BOT_NAME              PULZE Coach
PORT                  3001
NODE_ENV              production
JWT_SECRET            (generar: openssl rand -base64 32)
```

### Vercel (Web)
```
NEXT_PUBLIC_API_URL         (Railway URL)
NEXT_PUBLIC_WEB_URL         (Vercel URL)
NEXT_PUBLIC_WHATSAPP_NUMBER (tu número)
```

### Vercel (Backoffice)
```
NEXT_PUBLIC_API_URL         (Railway URL)
```

---

## ⚡ Deploy en 5 minutos

```bash
# 1. Railway (desde web)
open https://railway.app/new
# Importar ralborta/pulze → Agregar PostgreSQL → Configurar variables

# 2. Vercel Web
cd apps/web && vercel --prod

# 3. Vercel Backoffice  
cd ../backoffice && vercel --prod

# ✅ Listo!
```

---

## 🆘 Si algo falla

```bash
# Ver logs Railway
railway logs --tail

# Ver logs Vercel
vercel logs pulze-web
vercel logs pulze-backoffice

# Redeploy
railway up              # Railway
vercel --prod           # Vercel
```
