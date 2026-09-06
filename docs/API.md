# API Documentation

## Base URL

```
Web: http://localhost:3000
Mobile: Varies by device
```

## Authentication

All API routes use Supabase Auth for authentication.

### Headers

```
Authorization: Bearer <supabase_token>
Content-Type: application/json
```

## API Routes

### AI Routes

#### POST /api/ai/chat

Send a message to the AI assistant.

**Request:**
```json
{
  "message": "Give me date ideas"
}
```

**Response:**
```json
{
  "response": "Here are some date ideas..."
}
```

#### POST /api/ai/date-ideas

Generate date ideas based on preferences.

**Request:**
```json
{
  "budget": "medium",
  "location": "New York",
  "interests": ["art", "food"]
}
```

**Response:**
```json
{
  "dateIdeas": [
    {
      "title": "Art Gallery & Dinner",
      "description": "Visit MoMA and have dinner nearby",
      "estimatedCost": "$100",
      "duration": "4 hours"
    }
  ]
}
```

#### POST /api/ai/love-letter

Generate a love letter.

**Request:**
```json
{
  "partnerName": "Alex",
  "relationshipLength": "2 years",
  "specialMemories": "Our first trip to Paris",
  "tone": "romantic"
}
```

**Response:**
```json
{
  "loveLetter": "My dearest Alex,..."
}
```

#### POST /api/ai/message-suggestions

Generate romantic message suggestions.

**Request:**
```json
{
  "context": "Good morning anniversary message"
}
```

**Response:**
```json
{
  "suggestions": [
    "Good morning my love! Happy anniversary...",
    "Waking up next to you on our anniversary..."
  ]
}
```

#### POST /api/ai/recommend-partners

Get activity recommendations.

**Request:**
```json
{
  "preferences": {
    "interests": ["outdoor", "adventure"],
    "budget": "medium"
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "category": "Outdoor",
      "name": "Hiking Adventure",
      "description": "Go hiking together",
      "reason": "Matches your outdoor interests"
    }
  ]
}
```

### Notifications

#### POST /api/notifications/send

Send a push notification.

**Request:**
```json
{
  "userId": "user-uuid",
  "title": "Daily Love Note",
  "body": "Thinking of you...",
  "scheduledAt": "2026-09-06T08:00:00Z"
}
```

**Response:**
```json
{
  "success": true
}
```

### Feedback

#### POST /api/feedback

Submit user feedback.

**Request:**
```json
{
  "feedback": "Love the new calendar feature!",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

## Database Schema

### Tables

#### memories

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
title text
description text
photo_url text
created_at timestamp
```

#### goals

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
title text
description text
progress int
target int
created_at timestamp
```

#### messages

```sql
id uuid PRIMARY KEY
sender_id uuid REFERENCES auth.users
receiver_id uuid REFERENCES auth.users
content text
created_at timestamp
```

#### todos

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
title text
completed boolean
created_at timestamp
```

#### daily_love_notes

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
note text
scheduled_at timestamp
sent boolean
created_at timestamp
```

#### calendar_events

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
date timestamp
title text
type text
created_at timestamp
```

#### mood_logs

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
mood int
note text
date timestamp
created_at timestamp
```

#### financial_goals

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users
title text
target_amount numeric
current_amount numeric
created_at timestamp
```

## Environment Variables

See `.env.local.example` for all available variables.

### Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Optional

- `GROQ_API_KEY` - AI chat
- `GEMINI_API_KEY` - AI fallback
- `SENTRY_DSN` - Error tracking
- `NEXT_PUBLIC_GA_ID` - Analytics
