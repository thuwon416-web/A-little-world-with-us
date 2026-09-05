# A Little World With Us

A premium minimalist app for two lives gracefully becoming one.

## Features

### Core Features
- 💬 Real-time Chat (with file upload, GIF picker, voice messages)
- 💜 Care (period & symptom tracking, daily log, mood tracking)
- 📊 Mood Tracking & Insights with weekly visualization
- 📅 Period Calendar with Predictions
- 🔔 Smart Reminders (PMS, period, fertile, symptom)
- 🌐 Bilingual Support (EN/MM)
- 🎨 5 Themes + Random Theme (Emergent Airy, Midnight Romance, Sunset Glow, Ocean Breeze, Monochrome Noir)
- 📥 Export Data (CSV)
- 🤖 AI-Powered Features (multi-provider: Gemini, OpenRouter, HuggingFace)
- 📍 Location features (Nearby Places, Location Reminders, Location History)
- 🎵 Music & Companion Playlists
- 🧠 AI Love Coach & Relationship Guidance
- 🔐 PIN Lock & Security Features
- 📱 PWA Support for offline access

### Technical Features
- ✅ Supabase (Auth, Database, Storage, Realtime)
- ✅ Next.js 14 (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ PWA Support
- ✅ Server-side API routes (AI integration)
- ✅ Mobile-First Design with Bottom Navigation
- ✅ Context-based Translation System

## Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### Installation

1. Clone repo:
```bash
git clone https://github.com/thuwon416-web/A-little-world-with-us.git
cd A-little-world-with-us
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_PASSWORD=your-password

# Giphy API (for chat)
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_api_key

# AI API Keys (server-side only - NEVER commit to git)
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
NVIDIA_API_KEY=your_nvidia_api_key
CEREBRAS_API_KEY=your_cerebras_api_key
MISTRAL_API_KEY=your_mistral_api_key
COHERE_API_KEY=your_cohere_api_key
GROQ_API_KEY=your_groq_api_key
VOYAGE_API_KEY=your_voyage_api_key
CLOUDFLARE_API_KEY=your_cloudflare_api_key
```

4. Run Supabase migrations:
- Run all SQL files in `supabase/migrations/` in Supabase SQL Editor

5. Start dev server:
```bash
npm run dev
```

6. Open http://localhost:3000

## Deployment

### Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Import repo in Vercel:
- Visit https://vercel.com
- Import your GitHub repo
- Add environment variables in Vercel dashboard
- Deploy

### Environment Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` 
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `NEXT_PUBLIC_GIPHY_API_KEY` 
- `GEMINI_API_KEY` (server-side)
- `OPENROUTER_API_KEY` (server-side)
- ... (other AI API keys)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│ ├── (private)/      # Authenticated routes
│ ├── (auth)/         # Public auth routes
│ ├── api/            # API routes (AI integration)
│ └── layout.tsx      # Root layout with providers
├── components/       # Reusable UI components
│ ├── effects/        # Visual effects
│ ├── shared/         # Shared components
│ └── ui/             # Radix UI components
├── contexts/         # React contexts (Theme, Language)
├── features/         # Feature-based modules
│ ├── auth/           # Authentication
│ ├── care/           # Care & wellness tracking
│ ├── chat/           # Chat functionality
│ ├── location/       # Location features
│ ├── settings/       # Settings pages
│ └── ...
├── i18n/            # Translations (EN/MM)
│ └── locales/
├── lib/             # Utilities (Supabase, API calls, helpers)
└── ...
```

## Security

- API keys stored server-side only (never in frontend)
- `.env.local` excluded from git (in `.gitignore`)
- Supabase RLS (Row Level Security) enabled
- Authentication required for all private routes
- File upload validation (5MB limit, specific MIME types)

## License

Private - For personal use only
