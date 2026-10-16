# A Little World With Us — Project Overview

> Owner: Project maintainers  
> Update when: architecture, platform scope, or runtime boundaries change  
> Last Updated: 2026-10-16  
> Do NOT put here: live verification evidence, credentials, or tactical backlogs.

## 1. Identity & Purpose

A Little World With Us is a private digital sanctuary designed exclusively for two interconnected partners. It combines:
- Shared memory timeline, encrypted photo/video vault, and albums
- Real-time chat, care reminders, and daily check-ins
- WebRTC peer-to-peer audio/video calling
- Location sharing, safe zone geofencing alerts, and SOS emergency beacon
- Wellness check-ins, couple games, shared calendar, and Korean learning curriculum
- User-owned Google Drive photo backup

## 2. Standalone Platform Scope & Ports

| Surface | Platform | Local Development Port / Shell |
|---|---|---|
| **Web Portal** | Next.js 15+ / React / Tailwind CSS | `http://localhost:3005` |
| **Mobile App** | React Native / Expo (iOS & Android) | Expo Metro `8081` |
| **Backend & Realtime** | Supabase Edge Functions & Realtime Engine | Local / Cloud Functions |

## 3. System Architecture

```
Web Portal (Port 3005) <---> Supabase Realtime (WebSocket) <---> Mobile App (Port 8081)
        |                                                                |
        +-----------------> Supabase Edge Functions <--------------------+
                                    |
                            PostgreSQL Database
                            (56 Migrations Applied)
                                    |
                    +---------------+---------------+
                    |                               |
        Backblaze B2 / Supabase Storage     Google Drive
        (Client-side AES-GCM Encrypted)     (User Backup)
```

## 4. Repository Boundaries

- `apps/web-platform/frontend/`: Next.js web application (105 pages, 74 components).
- `apps/mobile/`: React Native / Expo mobile application (218 files).
- `packages/shared/`: Shared TypeScript contracts and utility types.
- `apps/web-platform/backend/supabase/`: SQL migrations (001 to 056) and Edge Functions.
- `docs/`: Canonical domain documentation.
- `archive/`: Preserved historical drafts and duplicate specifications.

## 5. Security & Trust Boundaries

- Dual-User Strict Scoping: All relational data belongs strictly to the linked couple UUID.
- Client-Side Encryption: Media blobs in the private vault use AES-GCM encryption in-memory before upload.
- Location Privacy: GPS background duty-cycling minimizes battery drain and only broadcasts geofence transition events when configured.
- Zero Cloud Credential Leakage: Service-role credentials never enter frontend or mobile code.