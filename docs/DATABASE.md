# Database

Owner: Backend / Supabase
Update when: schema, migrations, RLS, indexes, or database procedures change
Last Updated: 2026-10-08

Supabase is the application data and metadata source of truth.

The historical bootstrap README is stale: repository bootstrap material continues beyond migration 46 through the later 47–54 series. The previously flagged duplicate numeric prefixes 33, 51, and 52 have been reconciled on 2026-10-08: each filename represents a distinct SQL change (for example, 33 hardens helper search paths; 51 adds Cloudinary ownership fields or service-only deny policies; 52 adds B2/media fields or restores RLS-helper EXECUTE grants). The duplicate prefixes are therefore intentional historical filename reuse, not proof of an execution collision. Live migration history uses unique timestamped migration names.

Live Supabase migration head was checked directly on 2026-10-08: `20261007121841 — restore_rls_helper_execute`. The repository's highest numeric bootstrap filename is not proof of the live head.

Evidence: [Supabase project migrations](https://supabase.com/dashboard/project/mktfnwdvzbdrxfcvnolp/database/migrations) — live state observed 2026-10-08.

00_core.sql is destructive bootstrap material and must not be used against an existing production database without an explicit verified migration plan.

Security-sensitive RPCs must enforce authenticated/couple authorization. Internal offline functions are not intended for direct public execution.

Unused-index and FK-index advisor findings are deferred until workload evidence and Web↔Mobile parity are stable.

Current product documentation targets Korean Levels 1–6. Any schema constraint claiming 1–7 must be reconciled against the live database before being authoritative.
