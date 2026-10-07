# Development

Owner: Engineering
Update when: setup, local development, or scripts change
Last Updated: 2026-10-08

apps/web is the Web application; apps/mobile is the Expo application; backend/supabase contains database/bootstrap material; scripts contains utilities.

Use each package manifest and environment template for local setup. Never put production credentials in source.

Web verification includes lint, TypeScript, tests, accessibility tests, and production build. Mobile verification includes clean install, TypeScript, lint, and Jest.

Native Google OAuth client IDs and device permissions are EAS/device setup values, not Vercel variables.

Prefer package scripts and documented commands over ad-hoc commands. Record warnings separately from failures.