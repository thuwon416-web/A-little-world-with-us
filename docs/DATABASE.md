# Database

Owner: Backend / Supabase
Update when: schema, migrations, RLS, indexes, or database procedures change
Last Updated: 2026-10-08

Supabase is the application data and metadata source of truth.

The historical bootstrap README is stale: repository bootstrap material continues beyond migration 46 through the later 47–54 series. Duplicate numeric prefixes including 33, 51, and 52 are VERIFY until ordering/intent is confirmed.

The highest repository script number is not proof of the live Supabase migration head. Live head is VERIFY.

00_core.sql is destructive bootstrap material and must not be used against an existing production database without an explicit verified migration plan.

Security-sensitive RPCs must enforce authenticated/couple authorization. Internal offline functions are not intended for direct public execution.

Unused-index and FK-index advisor findings are deferred until workload evidence and Web↔Mobile parity are stable.

Current product documentation targets Korean Levels 1–6. Any schema constraint claiming 1–7 must be reconciled against the live database before being authoritative.