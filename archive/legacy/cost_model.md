# Cost model and operational controls

The app uses Supabase PostgreSQL as the source of truth, Cloudinary as primary user media storage, Google Drive as export/archive, and Upstash Redis for bounded rate limiting.

## Main cost drivers

- Database: queries, writes, indexes, backups and realtime usage.
- Media: Cloudinary storage, transformations and delivery.
- Location: write frequency and retained history.
- AI: provider requests and token volume.
- Redis: rate-limit counters and short-lived coordination.
- Observability: Sentry events, Axiom logs, Umami analytics and Logfire traces.

## Controls

1. Keep location updates adaptive rather than fixed high-frequency polling.
2. Rate-limit AI, uploads and location writes per authenticated user.
3. Keep the existing product retention policy; do not silently shorten it.
4. Prefer thumbnails/resized media for lists and galleries.
5. Keep logs free of tokens, message bodies and precise location data.
6. Review provider usage monthly before increasing limits.
7. Vercel deployment/cost controls remain deferred while the project is paused.

Provider pricing changes over time, so exact thresholds belong in provider consoles rather than application code.
