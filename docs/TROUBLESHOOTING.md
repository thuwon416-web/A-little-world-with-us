# Troubleshooting

Owner: Engineering / Operations
Update when: recurring failures or diagnostic procedures change
Last Updated: 2026-10-08

## Google Drive
Verify /api/drive/callback, exact Google Cloud production callback registration, and that OAuth starts from the supported production origin. Preview hosts are intentionally restricted by the host-bound state-cookie model.

## Database / RLS
For permission errors, inspect authenticated session state, helper grants, RLS policies, and couple/ownership checks. Do not weaken RLS as a workaround.

## Storage
If upload succeeds but rendering fails, verify Supabase metadata/provider reference, provider file existence, authenticated retrieval, and provider authorization.

## Dependencies
Assess advisories individually. Do not force breaking major upgrades solely to reduce alert count.

Use CURRENT_STATE.md for status and ROADMAP.md for future work; this document owns diagnostics.

## Memory Map reports a generic loading error

The Memory Map page loads the accepted couple link first, then queries `public.memories` for that couple. Supabase/PostgREST errors may be plain objects rather than native `Error` instances; catch handlers must preserve a non-empty `message` property instead of replacing every such error with the generic fallback. The diagnostic UI should show the provider's message while retaining a safe generic fallback for unknown values.

Current live audit (2026-10-13): `public.memories` has 51 Google Drive metadata rows and 3 Supabase-provider rows. The 51 Drive rows have location labels but no complete latitude/longitude pairs, so they should appear as saved place names rather than map pins. This explains missing pins, but does not by itself explain a query/load error. Do not claim the runtime root cause is resolved until the authenticated Memory Map flow is retested after this diagnostic change.
