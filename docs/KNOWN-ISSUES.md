# Known Issues

This document tracks known issues that are deferred to future sprints due to breaking changes or complexity.

## Risk Assessment

| Risk Level | Count | Platform | Packages |
|------------|-------|----------|-----------|
| 🔴 FIX NOW (Phase 1) | 0 | - | None - no vulnerabilities are directly exploitable in our app context |
| 🟡 FIX SOON (Phase 2-3) | 2 | Mobile | @remix-run/node (Critical - but unused), decode-uri-component (Moderate) |
| 🟢 DEFER (Sprint 5) | 70 | Web + Mobile | All remaining vulnerabilities (dev-time/build-time only, transitive deps) |

**Total:** 72 vulnerabilities (after mobile safe fixes)

### Why FIX NOW = 0
All vulnerabilities are:
- **Transitive dependencies** (not direct deps in package.json)
- **Dev-time or build-time only** (not runtime in production)
- **Not exploitable** in our app context (no user-controlled input in vulnerable paths)
- **Require major framework upgrades** (Next.js 16.x, Expo 57.0.24) to fix

### Remediation Plan for 🟡 FIX SOON
1. **@remix-run/node (Critical - CVE GHSA-9583-h5hc-x8cw):** Path traversal in file session storage. **LOW RISK** - brought in by expo-router via @expo/server, not directly used in our code. No user-controlled paths passed to this function. Will be fixed with Expo 57.0.24 upgrade in Sprint 5.
2. **decode-uri-component (Moderate - CVE GHSA-vcc3-ghjq-m6fr):** URL parsing vulnerability, low risk. Monitor for Expo update that fixes it.

## Vulnerability Summary

## Web Vulnerabilities (19 total)

| Package | Severity | CVE IDs | Fix Available | Fix Sprint | Notes |
|---------|----------|---------|---------------|-------------|-------|
| @vitest/mocker | Moderate | GHSA-82fw-gwwq-j7x9 | --force (breaks vitest) | Sprint 5 | Dev dependency only |
| esbuild | Moderate | GHSA-67mh-4wv8-2f99 | --force (breaks vitest) | Sprint 5 | Dev server only |
| minimatch | High | GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74 | --force (breaks eslint) | Sprint 5 | Dev dependency only |
| postcss | High | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | --force (breaks Next.js) | Sprint 5 | Build-time only |
| serialize-javascript | High | GHSA-5c6j-r48x-rmvq | --force (breaks next-pwa) | Sprint 5 | PWA build only |

## Mobile Vulnerabilities (58 total)

| Package | Severity | CVE IDs | Fix Available | Fix Sprint | Notes |
|---------|----------|---------|---------------|-------------|-------|
| @babel/runtime | Moderate | GHSA-968p-4wvh-cqc8 | --force (breaks WatermelonDB) | Sprint 5 | Dev dependency only |
| @xmldom/xmldom | High | GHSA-wh4c-j3r5-mjhp, GHSA-2v35-w6hq-6mfw, GHSA-f6ww-3ggp-fr8h, GHSA-x6wf-f3px-wcqx, GHSA-j759-j44w-7fr8, GHSA-6gmq-8vp8-gcm6, GHSA-w2rr-34g9-rvrj, GHSA-4w3w-2rp5-g8jm, GHSA-c7q8-3ch8-vqpv, GHSA-27p8-2357-5qqv, GHSA-6h8r-xr42-gp59, GHSA-8344-3jmq-59r6, GHSA-965w-775f-mr7g, GHSA-93r5-fhx6-vmg9 | --force (breaks Expo) | Sprint 5 | Expo framework dependency |
| ajv | Moderate | GHSA-2g4f-4pwh-qvx6 | --force (breaks expo-dev-client) | Sprint 5 | Dev dependency only |
| decode-uri-component | Moderate | GHSA-vcc3-ghjq-m6fr | --force (breaks expo-router) | Sprint 5 | Navigation dependency |
| fast-xml-parser | Moderate | GHSA-gh4j-gqv2-49f6 | --force (breaks React Native) | Sprint 5 | CLI dependency |
| image-size | High | GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq | --force (breaks React Native) | Sprint 5 | Metro bundler dependency |
| minimatch | High | GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74 | npm audit fix (safe) | Sprint 5 | Dev dependency only |
| postcss | High | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | --force (breaks Expo) | Sprint 5 | Expo framework dependency |
| send | Moderate | GHSA-m6fv-jmcg-4jfg | --force (breaks Expo) | Sprint 5 | Expo framework dependency |
| tar | Critical | GHSA-34x7-hfp2-rc4v, GHSA-8qq5-rm4j-mr97, GHSA-83g3-92jg-28cx, GHSA-qffp-2rhf-9h96, GHSA-9ppj-qmqm-q256, GHSA-r6q2-hw4h-h46w, GHSA-vmf3-w455-68vh, GHSA-w8wr-v893-vjvp, GHSA-23hp-3jrh-7fpw, GHSA-8x88-c5mf-7j5w, GHSA-gvwx-54wh-qm9j, GHSA-r292-9mhp-454m | --force (breaks Expo) | Sprint 5 | Expo framework dependency |
| turbo-stream | High | GHSA-rxv8-25v2-qmq8 | npm audit fix (safe) | Sprint 5 | React Router dependency |
| uuid | Moderate | GHSA-w5hq-g745-h8pq | --force (breaks Expo) | Sprint 5 | Expo framework dependency |

## Key Findings

### Why Deferred
1. **Web:** `npm audit fix --force` would upgrade Next.js to 16.3.5 (major breaking change)
2. **Mobile:** `npm audit fix --force` would upgrade Expo to 57.0.24 (major breaking change)
3. **Mobile:** 2 packages have safe fixes (minimatch, turbo-stream) - should be applied
4. Most vulnerabilities are in dev dependencies or build-time only

### Risk Assessment
- **Runtime dependencies:** PostCSS (build-time), serialize-javascript (PWA build), send/tar (Expo framework)
- **Dev dependencies:** @vitest/mocker, esbuild, minimatch, ajv, fast-xml-parser, uuid
- **Acceptable risk:** No user-controlled input in vulnerable paths (CSS, XML, tar)
- **Critical path:** tar vulnerability (critical) requires Expo upgrade

### Planned Fix - Sprint 5 (Q2 2026)
**Web:**
1. Upgrade Next.js to 16.x in dedicated sprint
2. Test all features (especially server components)
3. Deploy to production after thorough testing
4. Roll back if critical issues found

**Mobile:**
1. Upgrade Expo to latest SDK (57.0.24+)
2. Test on both iOS and Android
3. Apply safe fixes (minimatch, turbo-stream) immediately
4. Full Expo upgrade in Sprint 5

### Immediate Actions
- Apply safe fixes for mobile: `npm audit fix` (minimatch, turbo-stream)
- Monitor for security advisories on Next.js/Expo
- Consider patching critical tar vulnerability if Expo upgrade is delayed

## Update History
- **2026-09-18:** Initial documentation during Fix Phase 0
- **2026-09-18:** Added full vulnerability table (77 total across web + mobile)
