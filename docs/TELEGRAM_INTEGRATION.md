# Telegram Integration Guide: A-Little-World-With-Us

> **Project:** A Little World With Us (Couples Life, Memories, Learning & Care App)  
> **Directory:** `thuwon416@gmail.com\A-little-world-with-us`  
> **Runtime / Stack:** Next.js (TypeScript), Supabase, Expo, Vercel  
> **Primary Topic:** `❤️ A-Little-World`

---

## 1. Overview & Topic Role

A Little World With Us uses the Telegram Supergroup for couple care and daily reminders:
* Milestone and relationship anniversary countdowns.
* Daily Korean vocabulary words and quiz prompts.
* Instant shared expense logging alerts.
* Safety and location check-in notifications.

Couples can interact with quizzes and quickly review shared memories via inline buttons.

---

## 2. Topic Configuration

* **Suggested Topic Name:** `❤️ A-Little-World`
* **Suggested Topic ID:** `5` (or your assigned `message_thread_id`)
* **Color / Icon:** ❤️ Heart / Couple Care

---

## 3. Environment Variables

Configure these variables in `apps/web-platform/frontend/.env` or in the Vercel Dashboard under **Environment Variables**:

| Key | Type | Default | Description |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | String (Secret) | `""` | Bot token provided by `@BotFather` |
| `TELEGRAM_CHAT_ID` | String | `""` | Supergroup ID (e.g. `-100xxxxxxxxxx`) |
| `TELEGRAM_TOPIC_ID` | Integer | `None` | Thread ID for `#A-Little-World` topic |
| `TELEGRAM_ENABLED` | Boolean | `false` | Master toggle (`true` to enable delivery) |

---

## 4. Code Architecture

* **Service Module:** `apps/web-platform/frontend/src/lib/telegram.ts`
* **Type Contracts:** `packages/shared/src/index.ts` (`TelegramInlineButton`, `TelegramNotificationPayload`)
* **Import Interface:** `apps/web-platform/frontend/src/shared-types.ts`
* **Template:** `apps/web-platform/frontend/.env.example`

---

## 5. Available Action Hooks & API

### (1) Anniversary / Milestone Countdown
```typescript
import { notifyAnniversaryReminder } from '@/lib/telegram'

await notifyAnniversaryReminder(
  '1000 Days Anniversary Celebration',
  7,
  '2026-10-21'
)
```
* **Actions included:**
  - `[📖 Open Couple Memories]` (`world_open_memories`)

### (2) Daily Korean Vocabulary Card
```typescript
import { notifyKoreanDailyWord } from '@/lib/telegram'

await notifyKoreanDailyWord(
  '사랑',
  'sa-rang',
  'အချစ် (Love)',
  '나는 너를 사랑해 (I love you).'
)
```
* **Actions included:**
  - `[✍️ Take Daily Quiz]` (`world_korean_quiz`)

### (3) Shared Expense Logged Alert
```typescript
import { notifyExpenseLogged } from '@/lib/telegram'

await notifyExpenseLogged(
  15000,
  'Dinner & Groceries',
  'Dinner at City Mall Cafe',
  'Thuwon'
)
```
* **Actions included:**
  - `[📊 Open Budget Tracker]` (`world_open_budget`)

### (4) Safety Check-in Update
```typescript
import { notifySafetyCheckinAlert } from '@/lib/telegram'

await notifySafetyCheckinAlert(
  'Partner',
  'Arrived safely at Office',
  'Downtown Yangon'
)
```

---

## 6. Cloud Deployment Checklist (Vercel)

1. Open Vercel dashboard -> `a-little-world-with-us` web project.
2. Go to **Settings** -> **Environment Variables**.
3. Add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_TOPIC_ID`, and set `TELEGRAM_ENABLED=true`.
4. Trigger a new deployment or promote from git push.

---

## 7. Inbound Action Handler API

This project includes a dedicated inbound endpoint to receive callbacks from the Central Cloudflare Gateway:
* **Endpoint:** `POST /api/telegram/action`
* **Authentication:** send `Authorization: Bearer <TELEGRAM_ACTION_SECRET>` on every request. Configure the same dedicated random secret in Vercel and the Cloudflare Gateway. Requests are rejected if the secret is missing or invalid; the endpoint returns `503` when the server secret is not configured. Do not reuse `TELEGRAM_BOT_TOKEN` or `CRON_SECRET` for this purpose.
* **Supported Actions:**
  * `world_korean_quiz` -> Sends interactive Korean Quiz with multiple choice options
  * `world_quiz_ans:<A|B|C|D>` -> Evaluates user answer, awards points, and gives instant feedback
  * `world_open_memories` -> Sends direct link to the web memories album

---

## 8. AI Provider & API Keys Configuration

| Provider | Environment Key | Primary Role in A-Little-World-With-Us | Free / Paid Notes |
|---|---|---|---|
| **Gemini** | `GEMINI_API_KEY` | Korean learning dialogue & couple persona chat | High conversational warmth & Korean grammar |
| **OpenRouter** | `OPENROUTER_API_KEY` | Secondary free chat fallback | 50 req/day free tier |
| **Groq** | `GROQ_API_KEY` | Ultra-fast instant couple suggestions & quizzes | `openai/gpt-oss-20b` / `qwen/qwen3.8-27b` |
| **NVIDIA Build** | `NVIDIA_API_KEY` | Creative date ideas & shared memories reflection | `meta/llama-3.1-8b-instruct` |
| **Mistral** | `MISTRAL_API_KEY` | Couple trip & calendar planning | `mistral-small-latest` |
| **Cohere** | `COHERE_API_KEY` | Memory search embeddings & reranking | `command-r-plus` / `embed-v4.0` |
| **Voyage** | `VOYAGE_API_KEY` | Semantic photo album search embeddings | `voyage-3-lite` (512-dim) |
| **Cloudflare** | `CLOUDFLARE_API_TOKEN`<br>`CLOUDFLARE_ACCOUNT_ID` | Edge AI & fast sentiment analysis | 100k free req/day |
| **Hugging Face** | `HUGGINGFACE_API_KEY` | Local model weights & tokenizer assets | Inference API disabled (Oct 8); Hub/Spaces only |

---

## 9. Tuned Fallback Chains & AI Monitoring

### 💬 Chat & Couple Assistant Chain
1. 🥇 **Groq (`qwen/qwen3.8-27b`)** — Primary for instant message ideas & interactive quizzes (14,400 req/day free).
2. 🥈 **Gemini 2.5/3.5-flash** — Primary for Korean language teaching & emotional dialogue.
3. 🥉 **Cloudflare Workers AI (`llama-3.1-8b`)** — Edge resilience.
4. 4️⃣ **OpenRouter (Free tier)** — Emergency fallback.

### 🎙️ Voice Notes Transcription
* **Groq Whisper (`whisper-large-v3`)** / **Cloudflare Whisper** for instant couple voice note transcriptions.

### 📚 Semantic Memory Search (RAG)
1. 🥇 **Voyage AI (`voyage-3-lite`, 512-D)**
2. 🥈 **Cohere (`embed-v4.0`, 512-D)**

### 📊 Real-Time AI Usage & Health API
* **Endpoint:** `GET /api/ai/usage`
* **Telegram Command:** Send `/ai_status` or click `[🔄 Refresh Usage]` in Telegram to view active provider states and daily call counts.


