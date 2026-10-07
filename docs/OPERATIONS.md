# Operations

Owner: Operations
Update when: provider configuration, cost model, or operational procedures change
Last Updated: 2026-10-08

Provider credentials belong in deployment/platform secret stores. Never document secret values.

Sentry/Axiom/analytics are optional observability features unless the release gate explicitly requires them.

Control AI/media provider usage with feature-specific limits and monitor providers independently.

When provider configuration changes, verify both configuration presence and an actual authenticated request path. Record failures in CURRENT_STATE.md and diagnostic guidance in TROUBLESHOOTING.md.