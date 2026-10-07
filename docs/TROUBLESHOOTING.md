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