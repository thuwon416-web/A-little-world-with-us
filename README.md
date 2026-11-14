# 💖 A Little World With Us
> **Private Couples Intimacy, Shared Memories, Wellness & Life OS**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_&_Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![Groq](https://img.shields.io/badge/Groq-Ultra_Fast_Inference-F55036?style=flat-square)](https://groq.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=flat-square&logo=cloudinary)](https://cloudinary.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Production_Live-black?style=flat-square&logo=vercel)](https://a-little-world-with-us.vercel.app)
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-Active-26A5E4?style=flat-square&logo=telegram)](https://t.me/)

---

## 🌟 Overview

**A Little World With Us** is an end-to-end encrypted, deeply personal platform designed exclusively for couples to nurture connection, document memories, coordinate daily life, track wellness, and learn together.

Built with a modern web platform (Next.js 15) and native mobile client (Expo/React Native), backed by Supabase with Row Level Security (RLS) and real-time synchronization.

---

## 🚀 Key Features

* **📸 Vault & Memories**: Encrypted multimedia photo/video journaling with automated date, location, and emotional tone tagging.
* **💬 Private Real-Time Chat**: Encrypted end-to-end messaging, voice notes, ephemeral reactions, and media sharing.
* **🌸 Care & Daily Wellness**: Period tracking, basal temperature, hydration, mood logs, and shared wellness insights.
* **🗓️ Shared Planning & Calendar**: Shared anniversary countdowns, travel bucket lists, split-expense tracker, and interactive milestones.
* **🇰🇷 Interactive Learning**: Built-in interactive Korean language learning modules with customized spaced repetition.
* **🤖 Couples AI Companion**: Gemini 2.0 & Groq powered relationship assistant for anniversary ideas, gentle daily check-ins, and memory synthesis.
* **🤖 Telegram Integration**: Instant bidirectional notifications, question-of-the-day prompts, and SOS emergency alerts via dedicated Telegram Bot.

---

## 🏗️ Architecture & Tech Stack

```
               ┌────────────────────────────────────────────────────────┐
               │                Clients (Web & Mobile)                  │
               │  • Next.js 15 (TailwindCSS / App Router / PWA)        │
               │  • Expo / React Native (iOS & Android)                 │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           Backend Infrastructure                             │
│  • Supabase (PostgreSQL 15, Auth, Row Level Security, Realtime Channels)     │
│  • Upstash QStash & Redis (Task Queues & State Caching)                      │
│  • Cloudinary CDN & Backblaze B2 (High-Res Media Vault)                      │
│  • Google Gemini 2.0 Flash & Groq LLaMA 3.3 (Dual AI Engine)                 │
│  • Telegram Bot Webhook API (Bidirectional Notifications & Alerts)           │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quickstart & Local Development

### Prerequisites
* Node.js 20+ (managed via `.nvmrc`)
* pnpm 9+

### Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local

# 3. Run development servers
# Web platform:
pnpm --filter frontend dev

# Mobile platform:
pnpm --filter mobile start
```

---

## 🔒 Security & Privacy

* **Strict Row-Level Security (RLS)**: Enforced at database engine level. Only authenticated partners can access shared couples space.
* **Zero Cross-Contamination**: Isolated credentials, isolated databases, and isolated Telegram topics.
* **Encryption**: Zero client-side leak of private secrets or unencrypted memory tokens.

---

## 📜 License & Compliance

Distributed under private proprietary license. All Rights Reserved.
