# Our Forever

Our Forever is a private relationship companion for couples, built to help partners share memories, messages, plans, reminders, wellness check-ins, and location-aware experiences in one secure place.

## Overview

The project combines a Next.js web app with a React Native / Expo mobile app. Together, they provide a shared relationship dashboard that supports:

- private chat and media sharing
- shared planning and bucket lists
- reminders and notifications
- wellness tracking, moods, and care routines
- location sharing and calls
- AI-driven relationship suggestions and personalization
- memory vault and private notes

## Features

### Web app

- Dashboard and home overview
- Advanced chat experience
- Location and map view
- Calls (audio/video flows)
- AI love assistant and relationship guidance
- Reminders and notifications
- Shared plans and bucket list manager
- Wellness and care tracking
- Memories and vault features

### Mobile app

- Secure auth flow and login screen
- Messaging and reactions
- Media and reply support
- Location tracking and GPS sharing
- Audio/video call support
- AI idea tools for dates, gifts, and messages
- Shared plans and tasks
- Mood and wellness tracking
- Offline-first support with WatermelonDB sync

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase
- Expo / React Native
- WatermelonDB
- Framer Motion
- Radix UI
- Lucide icons

## Documentation

- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - How to set up environment variables
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-launch checklist

## Setup

### Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project
- Optional Expo tooling for mobile testing and builds

### Install dependencies

```bash
git clone <repository-url>
cd our-forever
npm install
cd mobile && npm install && cd ..
```

### Environment variables

Copy the example environment file and update values for your deployment:

```bash
cp .env.example .env.local
```

Example values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_NAME=Our Forever
NEXT_PUBLIC_APP_URL=https://ourforever.app

# Auth (for demo/testing)
NEXT_PUBLIC_APP_PASSWORD=your-app-password
```

The same pattern applies to the mobile app using `mobile/.env.example`.

### Run the apps

Web:

```bash
npm run dev
```

Mobile:

```bash
cd mobile
npm start
```

## Available Scripts

```bash
# Web
npm run dev
npm run build
npm run start
npm run lint
npx tsc --noEmit

# Mobile
cd mobile
npm run lint
npx tsc --noEmit
npx expo export --platform android
```

## Database and Security

Supabase is used for database access, auth integration, and optional realtime features. Make sure to configure RLS policies and keep all production credentials in environment variables rather than source files.

## License

This project is currently intended for private or partner-specific use and does not declare a public open-source license. If you plan to publish or distribute it publicly, add an explicit license before release.

## Contributing

- Create a focused branch for each change
- Keep secrets out of the repository
- Validate TypeScript and lint checks before merging
- Document significant feature work and deployment changes
