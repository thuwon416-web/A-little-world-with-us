# Deployment

Owner: Release Engineering
Update when: deployment targets or release procedures change
Last Updated: 2026-10-08

Web is deployed on Vercel. Root Directory is apps/web. There is no root vercel.json; apps/web/vercel.json is retained for application configuration such as cron definitions.

Mobile is built and released through Expo/EAS. Android/iOS build verification is a release gate.

Google Drive Web OAuth uses /api/drive/callback. The production flow is intentionally host-bound because OAuth state is stored in an HttpOnly host-bound cookie. Preview hosts are not equivalent production OAuth origins.

Release evidence must include exact commit, deployment, CI checks, and runtime/device evidence. Configuration presence is not proof of successful end-to-end behavior.