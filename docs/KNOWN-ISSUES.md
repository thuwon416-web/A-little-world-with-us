# Known Issues

**Last Updated:** 2026-09-26

This document tracks known security and release debt deferred because remediation
requires compatibility work or major dependency upgrades. Audit counts are a
snapshot and can change as the dependency tree and advisories change.

## Dependency Audit Snapshot

| Platform  | Critical | High | Moderate | Low | Total |
|-----------|----------|------|----------|-----|-------|
| Root/Web  | 3        | 10   | 4        | 0   | 17    |
| Mobile    | 2        | 7    | 39       | 2   | 50    |
| **Total** | **5**    | **17**| **43**   | **2**| **67**|

These are `npm audit` findings, not a statement that every advisory is
exploitable in the deployed application. The audit output identified GitHub
Security Advisories (GHSA); it did not provide CVE identifiers for the reported
items. Do not apply `npm audit fix --force` without validating the resulting
framework and toolchain changes.

## Security Known Debt

The dependency tree includes build-time and framework-transitive advisories,
including findings associated with `browserslist` through `@serwist/next`,
`postcss` through Next.js, and `tar` through the Expo toolchain. These items
remain tracked rather than being characterized as harmless: their practical
impact depends on the affected versions, execution path, and deployment
exposure. Reassess them against the current lockfiles and advisory details before
release.

Some remediations previously considered would have required breaking framework
changes. An earlier `@vercel/analytics` integration also had a peer-dependency
conflict with the existing build toolchain; SpeedInsights covers Web Vitals,
but does not provide page-view analytics. Revisit analytics separately if
product requirements call for visitor analytics.

## Deferred Upgrades

### Vitest 2.x to 5.x

- **Why deferred:** This is a major test-runner upgrade and may change
  configuration, transforms, mocking behavior, or coverage reporting.
- **Tests needed:** Run the complete Web unit suite and coverage thresholds;
  verify API route mocks, aliases, and coverage exclusions; compare CI behavior
  before and after the upgrade.

### Expo SDK 51 to 57

- **Why deferred:** This spans multiple major SDK releases and can require
  coordinated React Native, native-module, and platform configuration changes.
- **Tests needed:** Run Mobile typecheck, lint, and unit tests; build Android and
  iOS development/production artifacts; validate authentication, storage,
  location permissions/background tracking, notifications, maps, and calling on
  physical devices.

### Next.js 15 to 16

- **Why deferred:** This is a major framework change that may affect app-router
  behavior, server components, middleware, build output, and PWA integration.
- **Tests needed:** Run Web typecheck, lint, unit and E2E suites, and production
  build; manually verify authentication redirects, private routes, API routes,
  PWA behavior, and deployment on the target hosting platform.

## Historical Decision Context

An earlier assessment deferred four Web findings because the then-available
remediation appeared to require breaking changes to `@serwist/next` or Next.js.
That assessment also noted build-time exposure and accepted the risk at the
time. It is historical context, not a substitute for reassessing the current
advisories and production dependency paths.
