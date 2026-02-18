# PULZE API Documentation

## Base URL
```
http://localhost:3001/api (development)
https://your-bot.railway.app/api (production)
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication Endpoints

### POST /api/auth/magic-link
Generate a magic link for WebApp access.

**Request:**
```json
{
  "phone": "+54 9 11 1234-5678"
}
```

**Response:**
```json
{
  "magicLink": "https://app.pulze.com/auth?token=xxx",
  "expiresIn": "15 minutos"
}
```

### POST /api/auth/verify
Verify magic token and get session JWT.

**Request:**
```json
{
  "token": "magic-token-here"
}
```

**Response:**
```json
{
  "token": "jwt-session-token",
  "user": {
    "id": "uuid",
    "name": "Juan",
    "phone": "+54 9 11 1234-5678",
    "goal": "Bajar peso"
  }
}
```

### POST /api/auth/login
Direct login with phone (for testing).

**Request:**
```json
{
  "phone": "+54 9 11 1234-5678"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": { ... }
}
```

---

## 👤 User Endpoints

### GET /api/users/me
Get current user data.

**Headers:** Authorization required

**Response:**
```json
{
  "id": "uuid",
  "name": "Juan Pérez",
  "phone": "+54 9 11 1234-5678",
  "email": "juan@example.com",
  "goal": "Bajar peso",
  "restrictions": "Rodilla derecha",
  "activityLevel": "Activo",
  "currentStreak": 7,
  "longestStreak": 12,
  "isPremium": false,
  "preferences": { ... },
  "stats": { ... }
}
```

### PATCH /api/users/me
Update user profile.

**Headers:** Authorization required

**Request:**
```json
{
  "name": "Juan Pérez",
  "email": "newemail@example.com",
  "goal": "Ganar músculo",
  "restrictions": "Ninguna",
  "activityLevel": "Muy activo"
}
```

### GET /api/users/me/stats
Get user statistics.

**Headers:** Authorization required

**Response:**
```json
{
  "currentStreak": 7,
  "longestStreak": 12,
  "totalCheckIns": 45,
  "averageSleep": 4.2,
  "averageEnergy": 3.8,
  "trainingDays": 23,
  "contentsViewed": 15
}
```

---

## ✅ Check-in Endpoints

### POST /api/check-ins
Create new check-in.

**Headers:** Authorization required

**Request:**
```json
{
  "sleep": 4,
  "energy": 3,
  "mood": "Bien",
  "willTrain": true,
  "notes": "Me siento con energía"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "sleep": 4,
  "energy": 3,
  "mood": "Bien",
  "willTrain": true,
  "timestamp": "2024-02-17T10:30:00Z"
}
```

### GET /api/check-ins/week
Get check-ins for current week.

**Headers:** Authorization required

**Response:**
```json
{
  "checkIns": [
    {
      "id": "uuid",
      "sleep": 4,
      "energy": 3,
      "mood": "Bien",
      "timestamp": "2024-02-17T10:30:00Z"
    }
  ],
  "total": 5
}
```

### GET /api/check-ins/today
Check if today's check-in exists.

**Headers:** Authorization required

**Response:**
```json
{
  "exists": true,
  "checkIn": { ... }
}
```

### GET /api/check-ins/history?page=1&limit=10
Get paginated check-in history.

**Headers:** Authorization required

### GET /api/check-ins/streak
Calculate current streak.

**Headers:** Authorization required

**Response:**
```json
{
  "currentStreak": 7
}
```

---

## 📚 Content Endpoints

### GET /api/contents?category=Entrenamiento&type=tip
List contents with optional filters.

**Response:**
```json
{
  "contents": [
    {
      "id": "uuid",
      "category": "Entrenamiento",
      "type": "tip",
      "title": "5 tips para dormir mejor",
      "description": "...",
      "duration": "5 min",
      "viewCount": 234
    }
  ],
  "total": 10
}
```

### GET /api/contents/:id
Get specific content (increments view count).

### GET /api/contents/category/:category
Get contents by category.

### GET /api/contents/popular?limit=10
Get most viewed contents.

---

## ⚙️ Preferences Endpoints

### GET /api/preferences
Get user preferences.

**Headers:** Authorization required

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "reminderTime": "08:00",
  "reminderDays": ["1", "2", "3", "4", "5"],
  "language": "es",
  "timezone": "America/Argentina/Buenos_Aires"
}
```

### PATCH /api/preferences
Update preferences.

**Headers:** Authorization required

**Request:**
```json
{
  "reminderTime": "09:00",
  "reminderDays": ["1", "2", "3", "4", "5", "6", "0"],
  "language": "es"
}
```

---

## 🔧 Admin Endpoints (Backoffice)

All admin endpoints require admin authentication.

### GET /api/admin/users?status=active&page=1&limit=20
List all users with filters.

### GET /api/admin/users/:id
Get full user details including conversations.

### GET /api/admin/analytics?days=7
Get platform analytics and metrics.

**Response:**
```json
{
  "users": {
    "total": 1234,
    "active": 856,
    "premium": 145,
    "activeInPeriod": 432
  },
  "checkIns": {
    "total": 3245,
    "todayCount": 234
  },
  "engagement": {
    "retention7d": 78.3,
    "averageStreak": 6.5,
    "checkInsPerUser": 4.2
  }
}
```

### GET /api/admin/users/inactive?days=2
Get inactive users for reactivation.

### POST /api/admin/contents
Create new content.

**Request:**
```json
{
  "category": "Entrenamiento",
  "type": "tip",
  "title": "5 tips para dormir mejor",
  "description": "...",
  "content": "...",
  "tags": ["sueño", "descanso"],
  "difficulty": "Principiante",
  "duration": "5 min"
}
```

### PATCH /api/admin/contents/:id
Update content.

### DELETE /api/admin/contents/:id
Delete content (soft delete).

### GET /api/admin/templates
Get all message templates.

### PATCH /api/admin/templates/:id
Update template.

---

## Error Responses

All endpoints may return error responses:

```json
{
  "error": "Error message here"
}
```

Common status codes:
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (expired token)
- `404` - Not Found
- `500` - Internal Server Error
