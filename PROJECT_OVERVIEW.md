# Project Overview

Owner: Project maintainers
Update when: architecture or platform boundaries change
Last Updated: 2026-10-08

A Little World With Us is a couples-focused Web + Mobile application combining shared memories/media, chat, relationship/care, Korean learning, planning, finance, location/safety, notifications, and AI-assisted features.

Web: Next.js under apps/web, deployed to Vercel. Mobile: Expo/React Native under apps/mobile, released through EAS. Supabase provides authentication, authorization, relational data, realtime/offline coordination, and metadata/source-of-truth. Media and AI use provider-specific integrations documented in docs/STORAGE.md and docs/AI_RAG.md.

Core rules: Web/Mobile parity for shared behavior; Supabase remains metadata authority; secrets never enter source; repository state and live state are verified separately.