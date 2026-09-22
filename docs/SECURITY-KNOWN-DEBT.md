# Security — Known Debt

## Active Vulnerabilities (as of 2026-09-22)

### 1-2. browserslist (High) — via @serwist/next

- **Issue:** Memory growth + prototype write
- **Severity:** High
- **Source:** Transitive dependency via @serwist/next
- **Fix:** Requires @serwist/next downgrade (breaking PWA behavior)
- **Attack vector:** Build-time only — not exposed at runtime
- **Mitigation:** Currently accepting risk
- **Plan:** Upgrade when @serwist/next releases patched version

### 3-4. postcss (High) — via next

- **Issue:** XSS + arbitrary file read
- **Severity:** High
- **Source:** Transitive dependency via next
- **Fix:** Requires Next.js 9→16 major upgrade
- **Attack vector:** Build-time only — not exposed at runtime
- **Mitigation:** Currently accepting risk
- **Plan:** Schedule Next.js upgrade in Week 6+

## Decision Log

**Date:** 2026-09-22
**Decision:** Accept 4 vulnerabilities (Option A)
**Rationale:**
1. All are build-time dependencies, not runtime
2. Fixes require breaking upgrades (Next 9→16, @serwist breaking)
3. `npm audit fix` made it WORSE (4 → 17)
4. Low real-world risk for a couple app with controlled deployment

**Alternative considered:**
- B/C: Manual upgrade — Deferred to Week 6
- D: Wait for upstream — Already doing

## Deferred — @vercel/analytics

**Issue:** Peer dependency conflict (vite@5.4.21 vs vite@8.3.0 required by @sveltejs/kit)
**Workaround:** SpeedInsights already provides Web Vitals analytics
**Impact:** No visitor analytics (page views), but performance metrics covered
**Plan:** Revisit in Week 6 with alternative (Plausible / Umami) if needed
