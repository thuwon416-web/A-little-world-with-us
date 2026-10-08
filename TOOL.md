# Engineering and Documentation Workflow

Owner: Project maintainers
Update when: repository workflow or definition of done changes
Last Updated: 2026-10-08

## Read order
README.md → PROJECT_OVERVIEW.md → CURRENT_STATE.md → ROADMAP.md → UI_DESIGN_SYSTEM.md → TOOL.md → SECURITY.md → relevant docs.

## Git workflow
Work on main by default. Avoid unnecessary feature/cleanup branches. Preserve working behavior. Never commit credentials, OAuth secrets, encryption keys, provider tokens, or private relationship data.

## Phase protocol
1. Establish repository state. 2. Identify ownership. 3. Make smallest safe change. 4. Run relevant checks. 5. Inspect diff. 6. Update owning documentation. 7. Re-run verification. 8. Record evidence and remaining manual gates.

## Documentation protocol
Behavior/architecture → domain doc. Release status → CURRENT_STATE. Future work → ROADMAP. UI rule → UI_DESIGN_SYSTEM. Security boundary → SECURITY. Work procedure → TOOL/runbook. Historical fact → changelog/archive. Do not duplicate authoritative facts.

## Definition of Done
DONE means implementation exists and relevant automated checks pass. VERIFIED requires environment evidence. External-console/device/security-alert work stays PENDING or VERIFY until exercised.

## Verification Trigger Table
| Trigger | Re-check |
| --- | --- |
| Live migration/schema change | Supabase live migration list and relevant catalog/advisor evidence |
| Bootstrap filename/content change | Reconcile filename intent against live migration history |
| Storage provider/config change | Code precedence, Vercel env inventory, and live provider metadata |
| OAuth client/redirect change | Vercel env + external OAuth client registration + authenticated callback |
| Korean 4–6 source/data change | Exact-commit build + Web/Mobile content QA artifact |
| Mobile native configuration/build change | EAS build tied to current commit + device smoke |
| Dependabot/security-alert state change | Live GitHub Security/Dependabot alert list |
| Memories UI/component change | Current visual/device evidence |
| Period/fertility logic/UI change | Controlled authenticated scenario with observed result |

## Evidence
Separate repository head from live head and configured values from verified behavior. If evidence is unavailable, use VERIFY. Do not convert a source-code inspection into live verification.
