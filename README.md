# A Little World With Us

A private couples application for shared memories/media, chat, Care, planning, wellness, Korean learning, location/safety, notifications, and AI-assisted features.

## Architecture at a glance

- Web: Next.js in apps/web-platform/frontend, deployed on Vercel.
- Mobile: Expo/React Native in apps/mobile, released through EAS.
- Backend/data: Supabase Auth/Postgres/RLS/realtime/offline infrastructure and metadata source of truth.
- Media: provider-specific paths documented in docs/STORAGE.md.
- AI: feature-specific provider profiles documented in docs/AI_RAG.md.

## Repository structure

apps/web-platform/frontend — Web application and Route Handlers.
apps/mobile — Expo / React Native application.
packages/shared — stable cross-app contracts.
apps/web-platform/backend/supabase — database/bootstrap and Edge Functions.
docs — canonical domain documentation.
scripts — repository tooling.
.github — CI workflows.

## Current snapshot

The project is in final production-audit/release-verification work. Web/Mobile implementation and prior automated checks have substantial coverage, while Google Drive end-to-end, native/device, cross-device parity, and some external-console checks remain pending. See CURRENT_STATE.md for evidence-based status and ROADMAP.md for the master backlog.

## Quick start & Development Ports

| Component | Target Port / Shell | Startup Command |
|---|---|---|
| **Web Portal** | `http://localhost:3005` | `cd apps/web-platform/frontend && npm install && npm run dev -- -p 3005` |
| **Mobile App** | Expo Port `8081` | `cd apps/mobile && npm install && npx expo start --port 8081` |
| **Supabase Functions**| Local / Cloud Functions | `npx supabase functions serve` |

Never commit production credentials or API keys.

## Documentation map

- PROJECT_OVERVIEW.md — how the system is built.
- CURRENT_STATE.md — what is DONE, VERIFIED, PENDING, BLOCKED, DEFERRED, NEXT.
- ROADMAP.md — master phases, gates, acceptance, and backlog.
- UI_DESIGN_SYSTEM.md — UI construction rules.
- TOOL.md — engineering and documentation workflow.
- SECURITY.md — security boundaries and policy.
- docs/ — detailed architecture, development, testing, deployment, operations, database, API, AI/RAG, storage, and troubleshooting references.

Historical and feature-specific material is retained under its appropriate legacy/feature location during migration; active ownership belongs to the canonical files above.
