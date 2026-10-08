# Deployment

Owner: Release Engineering
Update when: deployment targets or release procedures change
Last Updated: 2026-10-08

Web is deployed on Vercel. Root Directory is apps/web. There is no root vercel.json; apps/web/vercel.json is retained for application configuration such as cron definitions.

Mobile is built and released through Expo/EAS. Android/iOS build verification is a release gate.

Google Drive Web OAuth uses /api/drive/callback. The production flow is intentionally host-bound because OAuth state is stored in an HttpOnly host-bound cookie. Preview hosts are not equivalent production OAuth origins.

On 2026-10-08, a fresh production deployment was explicitly started from runtime-bearing commit `1c3f78fa8fe34c518cb21b5834fbafa055892b82` as `dpl_6CnQ1obMNiPZ2oweVqethGQix2bi`. Its state is still BUILDING, so it is not yet release evidence. Current main is `67d9bc8bdf39b124c4eb71534973537e64f849e4`; GitHub compare shows the seven commits since `1c3f78f...` changed documentation only, not application/runtime source.

The immediately preceding production deployment that was READY was for an older documentation-only commit, not current main. Do not treat that deployment as proof that current main is live.

Release evidence must include exact commit, deployment, CI checks, and runtime/device evidence. Configuration presence is not proof of successful end-to-end behavior.
