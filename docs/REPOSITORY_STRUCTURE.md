# Repository Structure and Complete File Tree

> **Repository:** [thuwon416-web/A-little-world-with-us](https://github.com/thuwon416-web/A-little-world-with-us)  
> **Default branch:** `main`  
> **Snapshot commit:** `b235c13a8f9e63bcc0e2fd25f791d32681adda07`  
> **Snapshot source:** GitHub Git Trees API, recursive listing of the tracked tree at the commit above  
> **Generated:** 2026-10-15  
> **Coverage:** 1069 tracked tree entries (205 directories, 864 files); response was not truncated.

## 1. Purpose and accuracy

This document is the repository's full tracked-file tree and a navigation guide. It is intended to answer “what exists, where it lives, and which part of the product it belongs to.”

- The tree below reflects the Git-tracked repository at the stated commit, not a developer's local working directory.
- Git does not store empty directories. Directory entries shown here contain tracked descendants.
- Ignored files, local environment files, installed dependencies, build outputs, and untracked local files are not represented unless they are committed.
- The tree is a snapshot. If `main` changes, regenerate this file from the new commit rather than assuming the listing remains current.
- Names and locations are observed from the repository tree. Explanations in the orientation sections are summaries of the directory layout and package scripts, not a guarantee that every feature is production-verified.

## 2. Repository at a glance

| Area | Observed contents |
|---|---|
| Root | 16 tracked files directly at repository root |
| Web application | `apps/web/` — 605 tracked entries below this path; Next.js application |
| Mobile application | `apps/mobile/` — 262 tracked entries below this path; Expo Router / React Native application |
| Documentation | `docs/` — 48 tracked entries below this path, including nested documentation areas |
| Shared package | `packages/shared/` — shared package with source entry point at `packages/shared/src/index.ts` |
| Backend | `backend/` — backend-related tracked files (see tree for exact current contents) |
| Database / SQL | `sql/` — repository SQL verification and policy scripts; app/database migrations may also live elsewhere in the tree |
| Automation | `.github/workflows/`, `scripts/` — CI workflows and repository scripts |
| Historical material | `archive/` — archived tracked files; do not assume archived code is part of the active runtime |

## 3. Top-level responsibilities

### Root-level project files

- `README.md` — project entry point and high-level usage/status.
- `PROJECT_OVERVIEW.md` — high-level project and architecture overview.
- `CURRENT_STATE.md` — current verification status, known gaps, and next actions.
- `ROADMAP.md` — project phases, acceptance gates, and remaining work.
- `UI_DESIGN_SYSTEM.md` and `DESIGN.md` — UI/design guidance; confirm which is canonical before editing either.
- `TOOL.md` — tool and workflow instructions.
- `SECURITY.md` — security policy and reporting guidance.
- `CHANGELOG.md` — project change history.
- `package.json` — root npm scripts that delegate to web and mobile workspaces.
- `.nvmrc`, `.editorconfig`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.gitattributes` — runtime/editor/formatting/repository conventions.
- `.github/dependabot.yml` — dependency update configuration.
- `.github/workflows/` — automated security, tests, database policy checks, and production smoke E2E workflows.
- `apps/` — primary app surfaces.
- `packages/` — reusable package code.
- `backend/`, `sql/` — backend and SQL-related resources.
- `docs/` — detailed architecture, API, deployment, feature, setup, operations, security, mobile, and runbook documentation.
- `scripts/` — maintenance/verification scripts.
- `archive/` — historical material.

### Root workspace scripts (from root `package.json`)

- `npm run dev`, `npm run build`, `npm run start` — delegate to `apps/web`.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e` — web checks.
- `npm run mobile:dev`, `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test` — mobile development/checks.
- `npm run web:install` and `npm run mobile:install` — install app-specific dependencies.

See each app's own `package.json` for the current scripts and dependencies.

## 4. Application layout

### `apps/web/`

The web package is named `a-little-world-with-us-web`; it is a Next.js app. The tracked tree includes:

- `src/app/` — App Router routes, layouts, route handlers, loading/error/not-found boundaries, and page entry points. Use the tree to find exact route paths.
- `src/components/` — reusable UI components.
- `src/contexts/` — React context providers.
- `src/data/` — app data and content modules.
- `src/features/` — feature-focused modules.
- `src/hooks/` — reusable React hooks.
- `src/i18n/` — localization-related code.
- `src/lib/` — shared helpers, infrastructure, theme tokens, and integrations.
- `src/services/` — service-layer modules.
- `src/shared-types.ts` — shared TypeScript types entry point.
- `src/sw.ts` — service-worker source.
- `package.json` — web scripts/dependencies; at this snapshot the declared Next.js range is `^16.4.1`.
- Configuration and test files are listed exactly in the tree below.

**Routing note:** in Next.js App Router, the active route is generally derived from files under `src/app/`; verify the relevant route/layout and imports before changing UI. A component file outside the active import graph may not affect the rendered page.

### `apps/mobile/`

The mobile package is named `a-little-world-with-us-mobile`; its entry is `expo-router/entry`. The tracked tree includes:

- `app/` — Expo Router routes, route groups, tab layout, and screen entry points.
- `components/` — reusable mobile components.
- `assets/` — app assets.
- `app.json`, Babel/Metro/TypeScript/lint configuration, and build instructions.
- `package.json` — Expo/React Native dependencies and mobile scripts.
- `__tests__/` and other test/config paths where present in the tree.

**Routing note:** Expo Router derives routes from files under `apps/mobile/app/`. Check the route layout and imported components before assuming a similarly named file is active.

### `packages/shared/`

Shared package boundary. The tree shows `packages/shared/package.json` and `packages/shared/src/index.ts`. Verify exports and consumer imports before moving shared code between apps.

### `backend/`, `sql/`, and data services

These are separate tracked areas. The tree is a path inventory only: it does not prove a SQL script has been applied, a migration is deployed, a service is active, or production credentials are configured. Consult `docs/DATABASE.md`, `docs/API.md`, `docs/ARCHITECTURE.md`, storage/Drive documentation, and current-state evidence before operational changes.

## 5. Documentation navigation

Use the exact filenames and nested paths in the tree. The current repository includes documentation areas such as:

- Root project state, overview, roadmap, tools, design, and security.
- `docs/` — architecture, API, database, development/testing/deployment, AI/RAG, storage/Drive, accessibility, and troubleshooting documentation.
- Nested documentation folders for deployment, features, mobile, operations, runbooks, security, and setup.
- `docs/setup/google-drive.md` and `docs/DRIVE_ARCHITECTURE.md` — starting points for Drive configuration and storage architecture.
- `docs/TESTING.md`, `docs/DEPLOYMENT.md`, and related docs — consult current versions for checks and release procedures.

Do not assume every similarly named document is equally authoritative. Follow the source-of-truth and ownership rules in `TOOL.md`, `CURRENT_STATE.md`, and `ROADMAP.md`; reconcile conflicts rather than silently copying stale claims.

## 6. How to regenerate this tree

Regenerate from the latest `main` commit using GitHub's recursive Git tree endpoint:

```text
GET https://api.github.com/repos/thuwon416-web/A-little-world-with-us/git/trees/main?recursive=1
```

Required safeguards:
1. Record the returned tree/commit SHA and generation date.
2. Confirm `truncated` is `false`; if true, fetch subtrees individually before publishing.
3. Include all tracked paths, preserving case, spaces, punctuation, and file extensions exactly.
4. Sort directories before files at each level for readability.
5. Do not add local `.env` files, secrets, ignored artifacts, or untracked files.
6. Update this document in `docs/` and verify the committed snapshot SHA.
7. Re-check that the number of entries represented matches the API response.

## 7. Complete tracked repository tree

The following is the complete recursive tracked tree returned for commit `b235c13a8f9e63bcc0e2fd25f791d32681adda07`. Paths are shown exactly as stored by Git.

```text
├── .github/
│   ├── workflows/
│   │   ├── codeql.yml
│   │   ├── db-policy-check.yml
│   │   ├── e2e.yml
│   │   ├── gitleaks.yml
│   │   ├── production-smoke-e2e.yml
│   │   └── test.yml
│   └── dependabot.yml
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── about.tsx
│   │   │   │   ├── ai.tsx
│   │   │   │   ├── astrology.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── calls.tsx
│   │   │   │   ├── care.tsx
│   │   │   │   ├── chat.tsx
│   │   │   │   ├── couple-linking.tsx
│   │   │   │   ├── finance.tsx
│   │   │   │   ├── gallery.tsx
│   │   │   │   ├── games.tsx
│   │   │   │   ├── help.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── learning.tsx
│   │   │   │   ├── lists.tsx
│   │   │   │   ├── location.tsx
│   │   │   │   ├── memories.tsx
│   │   │   │   ├── memory-map.tsx
│   │   │   │   ├── mfa.tsx
│   │   │   │   ├── more.tsx
│   │   │   │   ├── music.tsx
│   │   │   │   ├── our-story.tsx
│   │   │   │   ├── plans.tsx
│   │   │   │   ├── privacy.tsx
│   │   │   │   ├── profile.tsx
│   │   │   │   ├── quiz.tsx
│   │   │   │   ├── reminders.tsx
│   │   │   │   ├── settings.tsx
│   │   │   │   ├── terms.tsx
│   │   │   │   ├── time-capsules.tsx
│   │   │   │   ├── vault.tsx
│   │   │   │   ├── watch-together.tsx
│   │   │   │   └── wellness.tsx
│   │   │   ├── _layout.tsx
│   │   │   ├── +not-found.tsx
│   │   │   ├── bucket-list.tsx
│   │   │   ├── call.tsx
│   │   │   └── login.tsx
│   │   ├── assets/
│   │   │   ├── app-store/
│   │   │   │   ├── placeholder-app-icon.svg
│   │   │   │   ├── placeholder-feature-graphic.svg
│   │   │   │   ├── placeholder-screenshot-1.svg
│   │   │   │   ├── placeholder-screenshot-2.svg
│   │   │   │   └── placeholder-screenshot-3.svg
│   │   │   ├── adaptive-icon.png
│   │   │   ├── android-icon-background.png
│   │   │   ├── android-icon-foreground.png
│   │   │   ├── android-icon-monochrome.png
│   │   │   ├── favicon.png
│   │   │   ├── icon.png
│   │   │   ├── splash-icon.png
│   │   │   └── splash.png
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── chat-types.ts
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   ├── GIFPicker.tsx
│   │   │   │   ├── PhotoShare.tsx
│   │   │   │   ├── ReplyThread.tsx
│   │   │   │   ├── StickerPicker.tsx
│   │   │   │   ├── VoiceMessageGallery.tsx
│   │   │   │   └── VoiceMessageRecorder.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── OnThisDay.tsx
│   │   │   │   └── OurStats.tsx
│   │   │   ├── learning/
│   │   │   │   ├── QuizEngine.tsx
│   │   │   │   └── QuizQuestion.tsx
│   │   │   ├── memories/
│   │   │   │   ├── GallerySection.tsx
│   │   │   │   ├── MemoryJournal.tsx
│   │   │   │   ├── MemoryMapSection.tsx
│   │   │   │   ├── MemorySlideshow.tsx
│   │   │   │   ├── OurStorySection.tsx
│   │   │   │   ├── SlideshowLaunchButton.tsx
│   │   │   │   └── TimeCapsulesSection.tsx
│   │   │   ├── our-story/
│   │   │   │   ├── AllMemories.tsx
│   │   │   │   ├── Categories.tsx
│   │   │   │   ├── MemoryCard.tsx
│   │   │   │   ├── TelegramArchive.tsx
│   │   │   │   └── Timeline.tsx
│   │   │   ├── settings/
│   │   │   │   └── GoogleDriveSection.tsx
│   │   │   ├── ui/
│   │   │   │   ├── AnimatedIcon.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── FeedbackState.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   └── Spinner.tsx
│   │   │   ├── vault/
│   │   │   │   ├── PasswordCard.tsx
│   │   │   │   ├── PasswordForm.tsx
│   │   │   │   ├── PasswordGenerator.tsx
│   │   │   │   ├── PasswordHealth.tsx
│   │   │   │   ├── PasswordList.tsx
│   │   │   │   ├── VaultSetupModal.tsx
│   │   │   │   └── VaultTabs.tsx
│   │   │   ├── wellness/
│   │   │   │   ├── AffirmationDeck.tsx
│   │   │   │   ├── ApologyCorner.tsx
│   │   │   │   ├── ArmchairMomentBoard.tsx
│   │   │   │   ├── CarefulQuietBoard.tsx
│   │   │   │   ├── CoupleMoodMeter.tsx
│   │   │   │   ├── CouplePromiseBoard.tsx
│   │   │   │   ├── CozyReentryBoard.tsx
│   │   │   │   ├── CycleTrackerBoard.tsx
│   │   │   │   ├── DayEchoBoard.tsx
│   │   │   │   ├── EasyBreathBoard.tsx
│   │   │   │   ├── EverydayRitualsBoard.tsx
│   │   │   │   ├── GentleHoldBoard.tsx
│   │   │   │   ├── GoldenLowBoard.tsx
│   │   │   │   ├── GratitudeWall.tsx
│   │   │   │   ├── LoveCheckInBoard.tsx
│   │   │   │   ├── LoveNotesBoard.tsx
│   │   │   │   ├── MellowBloomBoard.tsx
│   │   │   │   ├── PeriodSymptomsBoard.tsx
│   │   │   │   ├── SteadyLandingBoard.tsx
│   │   │   │   ├── TenderCompassBoard.tsx
│   │   │   │   ├── WellnessBoard.tsx
│   │   │   │   └── WellnessBoardShell.tsx
│   │   │   ├── BiometricAuth.tsx
│   │   │   ├── BucketListItem.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── CareChecklist.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── CycleTracker.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── IncomingCall.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── MoodSelector.tsx
│   │   │   ├── PlanCard.tsx
│   │   │   ├── PlanItem.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── SecondaryPage.tsx
│   │   │   └── WellnessCard.tsx
│   │   ├── context/
│   │   │   └── ThemeContext.tsx
│   │   ├── contexts/
│   │   │   └── VaultKeyContext.tsx
│   │   ├── data/
│   │   │   ├── korean-advanced.ts
│   │   │   ├── korean-lessons.ts
│   │   │   ├── korean-vocab.ts
│   │   │   ├── wellness-boards.ts
│   │   │   └── workouts.ts
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── features/
│   │   │   └── finance/
│   │   │       ├── AddExpenseModal.tsx
│   │   │       ├── CategoryFilter.tsx
│   │   │       ├── ExpenseList.tsx
│   │   │       └── finance-constants.ts
│   │   ├── hooks/
│   │   │   ├── useAI.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useCall.ts
│   │   │   ├── useLocation.ts
│   │   │   ├── useNetwork.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── usePeerCall.ts
│   │   │   ├── usePlans.ts
│   │   │   ├── useSync.ts
│   │   │   └── useWellness.ts
│   │   ├── i18n/
│   │   │   ├── messages/
│   │   │   │   ├── en.json
│   │   │   │   └── my.json
│   │   │   ├── config.tsx
│   │   │   └── useTranslation.ts
│   │   ├── lib/
│   │   │   ├── aiClient.ts
│   │   │   ├── auth.tsx
│   │   │   ├── cache.ts
│   │   │   ├── callIce.ts
│   │   │   ├── chatEncryption.ts
│   │   │   ├── date-utils.test.ts
│   │   │   ├── date-utils.ts
│   │   │   ├── googleDrive.ts
│   │   │   ├── haptics.ts
│   │   │   ├── love-score.test.ts
│   │   │   ├── love-score.ts
│   │   │   ├── mediaEncryption.ts
│   │   │   ├── supabase.ts
│   │   │   ├── telegram-export.test.ts
│   │   │   ├── telegram-export.ts
│   │   │   ├── tts.ts
│   │   │   ├── vault-crypto.ts
│   │   │   ├── vault-export.ts
│   │   │   ├── vault-import.ts
│   │   │   └── vault-storage.ts
│   │   ├── services/
│   │   │   ├── advanced.ts
│   │   │   ├── ai.ts
│   │   │   ├── astrology.ts
│   │   │   ├── calendar.ts
│   │   │   ├── call.ts
│   │   │   ├── care.ts
│   │   │   ├── careReminders.ts
│   │   │   ├── chatMedia.ts
│   │   │   ├── couple-lookup.ts
│   │   │   ├── cycleCalculator.test.ts
│   │   │   ├── cycleCalculator.ts
│   │   │   ├── dailyCheckin.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── emergency-contacts.ts
│   │   │   ├── favorites.ts
│   │   │   ├── finance-splitwise.ts
│   │   │   ├── finance.ts
│   │   │   ├── korean.ts
│   │   │   ├── location.ts
│   │   │   ├── memories.ts
│   │   │   ├── music.ts
│   │   │   ├── notifications.ts
│   │   │   ├── occasions.ts
│   │   │   ├── partnerCare.ts
│   │   │   ├── performance.ts
│   │   │   ├── plans.ts
│   │   │   ├── relationship-memories.ts
│   │   │   ├── relationshipDays.test.ts
│   │   │   ├── relationshipDays.ts
│   │   │   ├── safety-checkins.ts
│   │   │   ├── safety-sos.ts
│   │   │   ├── secondary.ts
│   │   │   ├── settings.ts
│   │   │   ├── sync.ts
│   │   │   ├── tsconfig.json
│   │   │   ├── vault-credentials.ts
│   │   │   ├── watchTogether.ts
│   │   │   ├── wellness-entries.ts
│   │   │   ├── wellness.ts
│   │   │   └── wellnessTracking.ts
│   │   ├── types/
│   │   │   ├── korean.ts
│   │   │   └── text-encoding.d.ts
│   │   ├── .env.example
│   │   ├── .eslintrc.js
│   │   ├── .gitignore
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   ├── BUILD_INSTRUCTIONS.md
│   │   ├── design-tokens.ts
│   │   ├── eas.json
│   │   ├── jest.config.js
│   │   ├── LICENSE
│   │   ├── metro.config.js
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── shared-types.ts
│   │   └── tsconfig.json
│   └── web/
│       ├── e2e/
│       │   ├── homepage.spec.ts
│       │   └── new-features.spec.ts
│       ├── public/
│       │   ├── icons/
│       │   │   └── icon.svg
│       │   ├── sounds/
│       │   │   └── pop.wav
│       │   ├── favicon.svg
│       │   ├── icon-192x192.png
│       │   ├── icon-512x512.png
│       │   ├── icon.svg
│       │   ├── logo.svg
│       │   ├── manifest.json
│       │   └── offline.html
│       ├── scripts/
│       │   └── validate-env.js
│       ├── src/
│       │   ├── app/
│       │   │   ├── (private)/
│       │   │   │   ├── about/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── ai/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── astrology/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── calendar/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── calls/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── care/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── chat/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── couple-linking/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── couple-status/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── cycle/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── dashboard/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── finance/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── gallery/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── games/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── help/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── learning/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── location/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── love-calculator/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── memories/
│       │   │   │   │   ├── map/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── music/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── onboarding/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── our-story/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── planning/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── plans/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── privacy/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── reminders/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── settings/
│       │   │   │   │   ├── notifications/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── terms/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── time-capsules/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── vault/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── watch-together/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── wellness/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── error.tsx
│       │   │   │   ├── layout.tsx
│       │   │   │   └── loading.tsx
│       │   │   ├── api/
│       │   │   │   ├── account/
│       │   │   │   │   ├── cancel-delete/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── request-delete/
│       │   │   │   │       └── route.ts
│       │   │   │   ├── ai/
│       │   │   │   │   ├── chat/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── curate/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── date-ideas/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── guardian/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── intimacy/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── journal-reflect/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── korean-quiz/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── love-letter/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── mediate/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── message-suggestions/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── recommend-partners/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── surprise/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── transcribe/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── usage/
│       │   │   │   │       └── route.ts
│       │   │   │   ├── auth/
│       │   │   │   │   └── pin/
│       │   │   │   │       ├── route.test.ts
│       │   │   │   │       └── route.ts
│       │   │   │   ├── cron/
│       │   │   │   │   ├── account-erasure/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── check-battery/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── check-geofence/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── check-missed-checkin/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── reminders/
│       │   │   │   │       └── route.ts
│       │   │   │   ├── drive/
│       │   │   │   │   ├── callback/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── chat-archive/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── chat-upload/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── delete/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── disconnect/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── export-memory/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── file/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── migrate-memory/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── start/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── status/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── sync-memories/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── upload/
│       │   │   │   │       ├── route.test.ts
│       │   │   │   │       └── route.ts
│       │   │   │   ├── export/
│       │   │   │   │   ├── route.test.ts
│       │   │   │   │   └── route.ts
│       │   │   │   ├── feedback/
│       │   │   │   │   ├── route.test.ts
│       │   │   │   │   └── route.ts
│       │   │   │   ├── media/
│       │   │   │   │   ├── b2-upload/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── b2-url/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── delete/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   ├── upload/
│       │   │   │   │   │   ├── route.test.ts
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── url/
│       │   │   │   │       └── route.ts
│       │   │   │   ├── memories/
│       │   │   │   │   └── index-legacy-gallery/
│       │   │   │   │       ├── route.test.ts
│       │   │   │   │       └── route.ts
│       │   │   │   ├── notifications/
│       │   │   │   │   ├── push-key/
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── push-subscription/
│       │   │   │   │       ├── route.test.ts
│       │   │   │   │       └── route.ts
│       │   │   │   └── telegram/
│       │   │   │       └── action/
│       │   │   │           └── route.ts
│       │   │   ├── couple/
│       │   │   │   └── accept/
│       │   │   │       └── page.tsx
│       │   │   ├── login/
│       │   │   │   └── page.tsx
│       │   │   ├── mfa/
│       │   │   │   └── page.tsx
│       │   │   ├── offline/
│       │   │   │   └── page.tsx
│       │   │   ├── signup/
│       │   │   │   └── page.tsx
│       │   │   ├── error.tsx
│       │   │   ├── globals.css
│       │   │   ├── layout.tsx
│       │   │   ├── loading.tsx
│       │   │   ├── manifest.json
│       │   │   ├── not-found.tsx
│       │   │   └── page.tsx
│       │   ├── components/
│       │   │   ├── effects/
│       │   │   │   └── ambient-background.tsx
│       │   │   ├── shared/
│       │   │   │   ├── ErrorBoundary.tsx
│       │   │   │   ├── ErrorReport.tsx
│       │   │   │   ├── FormErrorSummary.tsx
│       │   │   │   ├── ImageUpload.tsx
│       │   │   │   ├── KeyboardShortcutsHelp.tsx
│       │   │   │   ├── Loading.tsx
│       │   │   │   ├── PWAInstall.tsx
│       │   │   │   ├── Skeleton.tsx
│       │   │   │   ├── Spinner.tsx
│       │   │   │   ├── ThemeToggle.tsx
│       │   │   │   └── UI.tsx
│       │   │   ├── ui/
│       │   │   │   ├── accordion.tsx
│       │   │   │   ├── alert-dialog.tsx
│       │   │   │   ├── alert.tsx
│       │   │   │   ├── animated-icon.tsx
│       │   │   │   ├── aspect-ratio.tsx
│       │   │   │   ├── avatar.tsx
│       │   │   │   ├── badge.tsx
│       │   │   │   ├── breadcrumb.tsx
│       │   │   │   ├── button.tsx
│       │   │   │   ├── calendar.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── carousel.tsx
│       │   │   │   ├── chart.tsx
│       │   │   │   ├── checkbox.tsx
│       │   │   │   ├── collapsible.tsx
│       │   │   │   ├── command.tsx
│       │   │   │   ├── context-menu.tsx
│       │   │   │   ├── dialog.tsx
│       │   │   │   ├── drawer.tsx
│       │   │   │   ├── dropdown-menu.tsx
│       │   │   │   ├── empty-state.tsx
│       │   │   │   ├── form.tsx
│       │   │   │   ├── hover-card.tsx
│       │   │   │   ├── input-otp.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   ├── label.tsx
│       │   │   │   ├── menubar.tsx
│       │   │   │   ├── navigation-menu.tsx
│       │   │   │   ├── pagination.tsx
│       │   │   │   ├── popover.tsx
│       │   │   │   ├── progress.tsx
│       │   │   │   ├── radio-group.tsx
│       │   │   │   ├── resizable.tsx
│       │   │   │   ├── scroll-area.tsx
│       │   │   │   ├── select.tsx
│       │   │   │   ├── separator.tsx
│       │   │   │   ├── sheet.tsx
│       │   │   │   ├── skeleton.tsx
│       │   │   │   ├── slider.tsx
│       │   │   │   ├── sonner.tsx
│       │   │   │   ├── switch.tsx
│       │   │   │   ├── table.tsx
│       │   │   │   ├── tabs.tsx
│       │   │   │   ├── textarea.tsx
│       │   │   │   ├── toast.tsx
│       │   │   │   ├── toaster.tsx
│       │   │   │   ├── toggle-group.tsx
│       │   │   │   ├── toggle.tsx
│       │   │   │   └── tooltip.tsx
│       │   │   ├── wellness/
│       │   │   │   └── WellnessBoard.tsx
│       │   │   ├── AIChatWidget.tsx
│       │   │   ├── AIChatWidgetLoader.tsx
│       │   │   ├── FeedbackWidget.tsx
│       │   │   ├── MessageSuggestions.tsx
│       │   │   ├── NotificationPermission.tsx
│       │   │   ├── PWAInstallPrompt.tsx
│       │   │   ├── QueryProvider.tsx
│       │   │   └── WebVitalsReporter.tsx
│       │   ├── contexts/
│       │   │   ├── LanguageContext.tsx
│       │   │   ├── ThemeContext.tsx
│       │   │   └── VaultKeyContext.tsx
│       │   ├── data/
│       │   │   ├── korean-advanced.ts
│       │   │   ├── korean-lessons.ts
│       │   │   ├── korean-vocab.ts
│       │   │   └── wellness-boards.ts
│       │   ├── features/
│       │   │   ├── ai-guardian/
│       │   │   │   ├── context/
│       │   │   │   │   ├── detector.ts
│       │   │   │   │   └── keywords.ts
│       │   │   │   ├── contexts/
│       │   │   │   │   ├── intimacy-context.ts
│       │   │   │   │   ├── privacy-context.ts
│       │   │   │   │   └── relationship-context.ts
│       │   │   │   ├── personas/
│       │   │   │   │   ├── her-persona.ts
│       │   │   │   │   └── him-persona.ts
│       │   │   │   ├── AIGuardianProvider.tsx
│       │   │   │   ├── ExplicitAdviceControl.tsx
│       │   │   │   ├── intimacy-context.ts
│       │   │   │   ├── relationship-context.ts
│       │   │   │   └── useAIGuardian.ts
│       │   │   ├── astro/
│       │   │   │   ├── CompatibilityScore.tsx
│       │   │   │   ├── DailyHoroscope.tsx
│       │   │   │   ├── MonthlyForecast.tsx
│       │   │   │   ├── MoonPhase.tsx
│       │   │   │   └── RetrogradeAlert.tsx
│       │   │   ├── auth/
│       │   │   │   ├── app-shell.tsx
│       │   │   │   ├── AuthGuard.tsx
│       │   │   │   ├── BottomNav.tsx
│       │   │   │   ├── CoupleLinkStatus.tsx
│       │   │   │   ├── lock-screen.tsx
│       │   │   │   ├── PinLock.tsx
│       │   │   │   ├── RequirePassword.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── ThemeProvider.tsx
│       │   │   │   └── ThemeToggle.tsx
│       │   │   ├── care/
│       │   │   │   ├── ExportData.tsx
│       │   │   │   └── MoodChart.tsx
│       │   │   ├── chat/
│       │   │   │   ├── ChatHistoryExport.tsx
│       │   │   │   ├── ChatInputBar.tsx
│       │   │   │   ├── FileUpload.tsx
│       │   │   │   ├── GIFPicker.tsx
│       │   │   │   ├── PhotoShare.tsx
│       │   │   │   ├── RealtimeChat.tsx
│       │   │   │   ├── ReplyThread.tsx
│       │   │   │   ├── StickerPicker.tsx
│       │   │   │   └── VoiceMessageRecorder.tsx
│       │   │   ├── cycle/
│       │   │   │   ├── CareRhythmBoard.tsx
│       │   │   │   ├── LoveChecklist.tsx
│       │   │   │   └── MiniCareCheck.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── AnniversaryShareCard.tsx
│       │   │   │   ├── Confetti.tsx
│       │   │   │   ├── Countdown.tsx
│       │   │   │   ├── DaysCounter.tsx
│       │   │   │   ├── MemoryCard.tsx
│       │   │   │   ├── MusicPlayer.tsx
│       │   │   │   ├── OnThisDay.tsx
│       │   │   │   ├── OurStats.tsx
│       │   │   │   ├── QuickActions.tsx
│       │   │   │   ├── RelationshipStats.tsx
│       │   │   │   └── widgetRegistry.ts
│       │   │   ├── finance/
│       │   │   │   ├── AddExpenseModal.tsx
│       │   │   │   ├── AdvancedFinancePanel.tsx
│       │   │   │   ├── BalanceSummary.tsx
│       │   │   │   ├── CategoryFilter.tsx
│       │   │   │   ├── ExpenseList.tsx
│       │   │   │   ├── finance-constants.ts
│       │   │   │   └── SettleUpModal.tsx
│       │   │   ├── games/
│       │   │   │   ├── CoupleScoreboard.tsx
│       │   │   │   ├── DailyQuestionGame.tsx
│       │   │   │   ├── FuturePredictions.tsx
│       │   │   │   ├── GiftRecommender.tsx
│       │   │   │   ├── LoveCalculator.tsx
│       │   │   │   ├── LoveCalculatorMigrated.tsx
│       │   │   │   ├── LoveQuiz.tsx
│       │   │   │   ├── LoveWeather.tsx
│       │   │   │   ├── RelationshipQuests.tsx
│       │   │   │   ├── ScavengerHunt.tsx
│       │   │   │   └── TicTacToe.tsx
│       │   │   ├── gifts/
│       │   │   │   └── GiftReveal.tsx
│       │   │   ├── journey/
│       │   │   │   └── GuidedJourney.tsx
│       │   │   ├── learning/
│       │   │   │   ├── QuizEngine.tsx
│       │   │   │   └── QuizQuestion.tsx
│       │   │   ├── location/
│       │   │   │   ├── CoupleLocationDashboard.tsx
│       │   │   │   ├── EmergencySOS.tsx
│       │   │   │   └── PairLocationMap.tsx
│       │   │   ├── memories/
│       │   │   │   ├── DateArchive.tsx
│       │   │   │   ├── LegacyGallery.tsx
│       │   │   │   ├── LoveMapTimeline.tsx
│       │   │   │   ├── LoveStoryCards.tsx
│       │   │   │   ├── MemoryAlarm.tsx
│       │   │   │   ├── MemoryAnchor.tsx
│       │   │   │   ├── MemoryCurationAI.tsx
│       │   │   │   ├── MemoryKeepingBoard.tsx
│       │   │   │   ├── MemoryLocationPicker.tsx
│       │   │   │   ├── MemoryMap.tsx
│       │   │   │   ├── MemoryMosaic.tsx
│       │   │   │   ├── MemoryOfTheDay.tsx
│       │   │   │   ├── MemorySlideshow.tsx
│       │   │   │   ├── Photo3DEffect.tsx
│       │   │   │   ├── PhotoExport.tsx
│       │   │   │   ├── SlideshowLaunchButton.tsx
│       │   │   │   └── TimeCapsule.tsx
│       │   │   ├── music/
│       │   │   │   ├── music-data.ts
│       │   │   │   ├── music-types.ts
│       │   │   │   ├── SharedPlaylist.tsx
│       │   │   │   └── YouTubePlayer.tsx
│       │   │   ├── notes/
│       │   │   │   └── LoveNoteGenerator.tsx
│       │   │   ├── onboarding/
│       │   │   │   └── OnboardingWizard.tsx
│       │   │   ├── our-story/
│       │   │   │   ├── AllMemories.tsx
│       │   │   │   ├── Categories.tsx
│       │   │   │   ├── ImportedTelegramMessages.tsx
│       │   │   │   ├── MemoryCard.tsx
│       │   │   │   ├── TelegramImport.tsx
│       │   │   │   └── Timeline.tsx
│       │   │   ├── planning/
│       │   │   │   ├── BucketList.tsx
│       │   │   │   ├── CoupleDreamBoard.tsx
│       │   │   │   ├── FutureDatePlanner.tsx
│       │   │   │   ├── LoveCalendar.tsx
│       │   │   │   ├── SharedCalendar.tsx
│       │   │   │   ├── SharedWishlist.tsx
│       │   │   │   └── TinyWinsTracker.tsx
│       │   │   ├── replies/
│       │   │   │   └── PrivateReplyWall.tsx
│       │   │   ├── settings/
│       │   │   │   ├── AccountDeletion.tsx
│       │   │   │   ├── AIPrivacySettings.tsx
│       │   │   │   ├── CoupleSettings.tsx
│       │   │   │   ├── FavoritesWidget.tsx
│       │   │   │   ├── FinanceExport.tsx
│       │   │   │   ├── HealthProfileWidget.tsx
│       │   │   │   ├── LanguageSwitcher.tsx
│       │   │   │   ├── PhotoExportSettings.tsx
│       │   │   │   ├── PINLockWidget.tsx
│       │   │   │   ├── PWAInstallPrompt.tsx
│       │   │   │   ├── RemindersWidget.tsx
│       │   │   │   ├── SecuritySettings.tsx
│       │   │   │   └── TwoFactorAuthWidget.tsx
│       │   │   └── vault/
│       │   │       ├── PasswordCard.tsx
│       │   │       ├── PasswordForm.tsx
│       │   │       ├── PasswordGenerator.tsx
│       │   │       ├── PasswordHealth.tsx
│       │   │       ├── PasswordList.tsx
│       │   │       ├── VaultCard.tsx
│       │   │       ├── VaultSetupModal.tsx
│       │   │       └── VaultTabs.tsx
│       │   ├── hooks/
│       │   │   ├── use-toast.ts
│       │   │   ├── useFinanceBalance.ts
│       │   │   ├── useKeyboardShortcuts.ts
│       │   │   ├── useMemories.ts
│       │   │   ├── usePrefersReducedMotion.ts
│       │   │   └── useRealtimeSync.ts
│       │   ├── i18n/
│       │   │   └── locales/
│       │   │       ├── en.json
│       │   │       └── my.json
│       │   ├── lib/
│       │   │   ├── ai/
│       │   │   │   ├── build-memories-context.ts
│       │   │   │   ├── her-persona.ts
│       │   │   │   ├── him-persona.ts
│       │   │   │   ├── privacy-guard.ts
│       │   │   │   ├── providers.ts
│       │   │   │   ├── request-client.ts
│       │   │   │   ├── role-resolver.ts
│       │   │   │   ├── route-helpers.ts
│       │   │   │   ├── safety.ts
│       │   │   │   ├── sanitize.ts
│       │   │   │   └── usage-log.ts
│       │   │   ├── api/
│       │   │   │   └── cron-helpers.ts
│       │   │   ├── admin.ts
│       │   │   ├── analytics.ts
│       │   │   ├── astrology.ts
│       │   │   ├── auth.ts
│       │   │   ├── backblaze-b2.ts
│       │   │   ├── care-data.test.ts
│       │   │   ├── care-data.ts
│       │   │   ├── chatEncryption.ts
│       │   │   ├── chatEncryptionServer.ts
│       │   │   ├── chatMedia.ts
│       │   │   ├── cloudinary-url.ts
│       │   │   ├── cloudinary.ts
│       │   │   ├── constants.ts
│       │   │   ├── couple-link.ts
│       │   │   ├── couples.test.ts
│       │   │   ├── couples.ts
│       │   │   ├── csrf.ts
│       │   │   ├── cycle-parity.test.ts
│       │   │   ├── date-utils.test.ts
│       │   │   ├── date-utils.ts
│       │   │   ├── errorLogger.ts
│       │   │   ├── exportData.ts
│       │   │   ├── favorites.ts
│       │   │   ├── google-drive.test.ts
│       │   │   ├── google-drive.ts
│       │   │   ├── healthProfile.ts
│       │   │   ├── imageCompressor.ts
│       │   │   ├── love-score.ts
│       │   │   ├── mediaEncryption.ts
│       │   │   ├── notifications.ts
│       │   │   ├── observability.ts
│       │   │   ├── offline-queue.ts
│       │   │   ├── onboarding.ts
│       │   │   ├── photoPipeline.ts
│       │   │   ├── privacy.ts
│       │   │   ├── query-client.ts
│       │   │   ├── rate-limit.test.ts
│       │   │   ├── rate-limit.ts
│       │   │   ├── relationship-days.test.ts
│       │   │   ├── relationship-days.ts
│       │   │   ├── storage.ts
│       │   │   ├── supabase-server.ts
│       │   │   ├── supabase.ts
│       │   │   ├── telegram-export.test.ts
│       │   │   ├── telegram-export.ts
│       │   │   ├── telegram.ts
│       │   │   ├── theme-tokens.ts
│       │   │   ├── tts.ts
│       │   │   ├── upload-validation.test.ts
│       │   │   ├── upload-validation.ts
│       │   │   ├── utils.ts
│       │   │   ├── vault-crypto.test.ts
│       │   │   ├── vault-crypto.ts
│       │   │   ├── vault-export.ts
│       │   │   ├── vault-import.ts
│       │   │   ├── vault-storage.ts
│       │   │   ├── voiceRecorder.ts
│       │   │   ├── watchTogether.test.ts
│       │   │   ├── watchTogether.ts
│       │   │   ├── web-push-server.ts
│       │   │   └── web-vitals.ts
│       │   ├── services/
│       │   │   ├── calendar.ts
│       │   │   ├── care.ts
│       │   │   ├── chat.ts
│       │   │   ├── emergency-contacts.ts
│       │   │   ├── finance-splitwise.ts
│       │   │   ├── finance.ts
│       │   │   ├── korean-quiz-ai.ts
│       │   │   ├── korean.ts
│       │   │   ├── memories.ts
│       │   │   ├── relationship-memories.ts
│       │   │   ├── safety-checkins.ts
│       │   │   ├── safety-sos.ts
│       │   │   ├── vault-credentials.ts
│       │   │   ├── vault.ts
│       │   │   ├── wellness-entries.ts
│       │   │   └── wellness.ts
│       │   ├── tests/
│       │   │   ├── a11y.test.tsx
│       │   │   └── setup.ts
│       │   ├── types/
│       │   │   ├── index.ts
│       │   │   ├── korean.ts
│       │   │   ├── web-push.d.ts
│       │   │   └── wellness.ts
│       │   ├── shared-types.ts
│       │   └── sw.ts
│       ├── .env.example
│       ├── .env.production.example
│       ├── eslint.config.mjs
│       ├── middleware.ts
│       ├── next-env.d.ts
│       ├── next.config.js
│       ├── package-lock.json
│       ├── package.json
│       ├── playwright.config.ts
│       ├── postcss.config.js
│       ├── sentry.client.config.js
│       ├── sentry.edge.config.js
│       ├── sentry.server.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── vercel.json
│       └── vitest.config.ts
├── archive/
│   └── legacy/
│       ├── A11Y-CONTRAST-AUDIT.md
│       ├── A11Y-TESTING.md
│       ├── architecture-overview.md
│       ├── backblaze-b2.md
│       ├── BUILD_INSTRUCTIONS.md
│       ├── CHANGELOG.md
│       ├── cost_model.md
│       ├── COUPLE-UNLINK.md
│       ├── data-retention.md
│       ├── deployment-DEPLOYMENT.md
│       ├── DESIGN.md
│       ├── docs-PROJECT_STATUS.md
│       ├── docs-README.md
│       ├── docs-SETUP.md
│       ├── google-drive.md
│       ├── ICONS.md
│       ├── KNOWN-ISSUES.md
│       ├── KOREAN_CURRICULUM.md
│       ├── MEDIA-ENCRYPTION.md
│       ├── mobile-release.md
│       ├── provider-api-configuration.md
│       ├── scripts-README.md
│       ├── storage-architecture.md
│       ├── supabase-bootstrap-README.md
│       └── WELLNESS-DESIGN.md
├── backend/
│   └── supabase/
│       ├── bootstrap/
│       │   ├── 00_core.sql
│       │   ├── 01_chat.sql
│       │   ├── 02_wellness.sql
│       │   ├── 03_safety.sql
│       │   ├── 04_finance.sql
│       │   ├── 05_vault.sql
│       │   ├── 06_ai.sql
│       │   ├── 07_location.sql
│       │   ├── 08_learning.sql
│       │   ├── 09_memories.sql
│       │   ├── 10_misc.sql
│       │   ├── 11_sos_constraint.sql
│       │   ├── 12_admin_roles.sql
│       │   ├── 14_rpc_functions.sql
│       │   ├── 15_media_mime_types.sql
│       │   ├── 15_performance_indexes.sql
│       │   ├── 16_telegram_import.sql
│       │   ├── 17_pair_location_access.sql
│       │   ├── 18_storage_pair_scope.sql
│       │   ├── 19_reminder_realtime.sql
│       │   ├── 20_call_signals_realtime.sql
│       │   ├── 21_web_reminder_push.sql
│       │   ├── 22_call_media_signals.sql
│       │   ├── 23_reliability_security_hardening.sql
│       │   ├── 24_couple_invite_rpc.sql
│       │   ├── 25_security_hardening.sql
│       │   ├── 26_targeted_performance_indexes.sql
│       │   ├── 27_consolidate_permissive_policies.sql
│       │   ├── 28_couple_only_location_access.sql
│       │   ├── 29_single_couple_scope.sql
│       │   ├── 30_remove_location_admin_helper.sql
│       │   ├── 31_sync_contract_parity.sql
│       │   ├── 32_enable_shared_feature_realtime.sql
│       │   ├── 33_harden_push_device_lifecycle.sql
│       │   ├── 33_harden_security_definer_search_path.sql
│       │   ├── 34_add_fk_covering_indexes.sql
│       │   ├── 35_optimize_rls_auth_initplan.sql
│       │   ├── 36_harden_remaining_security_definer_search_paths.sql
│       │   ├── 37_schedule_retention_cleanup.sql
│       │   ├── 38_fix_care_period_save_rpc.sql
│       │   ├── 39_google_drive_connections.sql
│       │   ├── 40_index_user_locations_couple_id.sql
│       │   ├── 41_account_deletion_and_audit.sql
│       │   ├── 42_account_deletion_queue_auth_lifecycle.sql
│       │   ├── 43_location_history_aggregates.sql
│       │   ├── 44_scope_location_aggregate.sql
│       │   ├── 45_offline_sync_and_realtime_backpressure.sql
│       │   ├── 46_fix_location_address_cache_rls.sql
│       │   ├── 47_vault_credentials_policy_hardening.sql
│       │   ├── 48_account_deletion_transactional_rpc.sql
│       │   ├── 49_messages_soft_delete_policy.sql
│       │   ├── 50_account_deletion_shared_ownership.sql
│       │   ├── 51_cloudinary_media_ownership.sql
│       │   ├── 51_service_only_deny_policies.sql
│       │   ├── 52_large_media_storage_fields.sql
│       │   ├── 52_restore_rls_helper_execute.sql
│       │   ├── 53_drive_first_archive.sql
│       │   ├── 53_final_security_policy_hardening.sql
│       │   ├── 54_drive_archive_performance.sql
│       │   ├── 54_optimize_final_rls_auth_initplan.sql
│       │   ├── 55_restore_memory_location_and_journal_columns.sql
│       │   └── README.md
│       ├── functions/
│       │   ├── _shared/
│       │   │   └── haversine.ts
│       │   ├── check-battery/
│       │   │   └── index.ts
│       │   ├── check-geofence/
│       │   │   └── index.ts
│       │   ├── check-missed-checkin/
│       │   │   └── index.ts
│       │   ├── checkin-notify/
│       │   │   └── index.ts
│       │   ├── location-alerts/
│       │   │   └── index.ts
│       │   ├── reveal-surprises/
│       │   │   └── index.ts
│       │   ├── reverse-geocode/
│       │   │   └── index.ts
│       │   └── sos-resolved/
│       │       └── index.ts
│       └── config.toml
├── docs/
│   ├── architecture/
│   │   └── overview.md
│   ├── deployment/
│   │   └── DEPLOYMENT.md
│   ├── features/
│   │   ├── couple-unlink.md
│   │   ├── korean-curriculum.md
│   │   └── wellness-design.md
│   ├── mobile/
│   │   └── release.md
│   ├── ops/
│   │   ├── cost_model.md
│   │   └── storage-architecture.md
│   ├── runbooks/
│   │   └── mobile-release.md
│   ├── security/
│   │   └── data-retention.md
│   ├── setup/
│   │   ├── backblaze-b2.md
│   │   ├── google-drive.md
│   │   └── provider-api-configuration.md
│   ├── A11Y-CONTRAST-AUDIT.md
│   ├── A11Y-TESTING.md
│   ├── AI_RAG.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── COUPLE-UNLINK.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   ├── DRIVE_ARCHITECTURE.md
│   ├── FINAL_VERIFICATION.md
│   ├── ICONS.md
│   ├── KNOWN-ISSUES.md
│   ├── KOREAN_CURRICULUM.md
│   ├── master_result all
│   ├── MEDIA-ENCRYPTION.md
│   ├── OPERATIONS.md
│   ├── PROJECT_STATUS.md
│   ├── README.md
│   ├── RELEASE_CLOSEOUT.md
│   ├── RELEASE_EVIDENCE.md
│   ├── SETUP.md
│   ├── STORAGE.md
│   ├── TELEGRAM_INTEGRATION.md
│   ├── TESTING.md
│   ├── TROUBLESHOOTING.md
│   └── WELLNESS-DESIGN.md
├── packages/
│   └── shared/
│       ├── src/
│       │   └── index.ts
│       └── package.json
├── scripts/
│   ├── README.md
│   ├── requirements.txt
│   ├── upload_relationship_memories.py
│   └── verify_upload.py
├── sql/
│   ├── location_address_cache_rls_verification.sql
│   └── rules_coverage_check.sql
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .nvmrc
├── .prettierignore
├── .prettierrc
├── CHANGELOG.md
├── CURRENT_STATE.md
├── DESIGN.md
├── package.json
├── PROJECT_OVERVIEW.md
├── README.md
├── ROADMAP.md
├── SECURITY.md
├── TOOL.md
└── UI_DESIGN_SYSTEM.md
```

---
*Generated from repository metadata. This file documents structure; it is not a runtime, security, deployment, or feature-verification report.*
