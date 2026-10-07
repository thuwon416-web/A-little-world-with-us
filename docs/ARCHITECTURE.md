# Architecture

Owner: Engineering
Update when: system boundaries or shared data flow change
Last Updated: 2026-10-08

Web (Next.js/Vercel) and Mobile (Expo/React Native/EAS) share product behavior and Supabase-backed data. Supabase provides authentication, authorization, relational data, realtime/offline infrastructure, and metadata.

Data flow: client → authenticated server/API → Supabase metadata/source of truth → provider-specific media/AI integrations. Shared memories preserve metadata and provider references so media can be retrieved later.

Major integrations include Google Drive, Cloudinary, Backblaze B2, Supabase Storage, Redis/QStash where configured, and multiple AI providers.

Deployment decisions: Web Vercel with Root Directory apps/web; Mobile Expo/EAS. Repository and live-system state must be verified separately.